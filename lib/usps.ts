const USPS_BASE =
  process.env.USPS_ENV === 'testing'
    ? 'https://apis-tem.usps.com'
    : 'https://apis.usps.com'

// OAuth2 token cache — USPS tokens last ~8 hours
let _token: { value: string; expiresAt: number } | null = null

export async function getUspsToken(): Promise<string> {
  if (_token && Date.now() < _token.expiresAt) return _token.value

  const res = await fetch(`${USPS_BASE}/oauth2/v3/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: process.env.USPS_CONSUMER_KEY!,
      client_secret: process.env.USPS_CONSUMER_SECRET!,
    }),
  })

  if (!res.ok) throw new Error(`USPS auth failed: ${await res.text()}`)
  const data = await res.json()

  _token = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }
  return _token.value
}

// Payment token cache — valid for 8 hours
let _paymentToken: { value: string; expiresAt: number } | null = null

async function getPaymentToken(bearerToken: string): Promise<string> {
  if (_paymentToken && Date.now() < _paymentToken.expiresAt) return _paymentToken.value

  const crid = process.env.USPS_CRID!
  const mid = process.env.USPS_MID!
  const accountNumber = process.env.USPS_EPS_ACCOUNT!

  const res = await fetch(`${USPS_BASE}/payments/v3/payment-authorization`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${bearerToken}`,
    },
    body: JSON.stringify({
      roles: [
        {
          roleName: 'PAYER',
          CRID: crid,
          MID: mid,
          manifestMID: mid,
          accountType: 'EPS',
          accountNumber,
        },
        {
          roleName: 'LABEL_OWNER',
          CRID: crid,
          MID: mid,
          manifestMID: mid,
          accountType: 'EPS',
          accountNumber,
        },
      ],
    }),
  })

  if (!res.ok) throw new Error(`USPS payment auth failed: ${await res.text()}`)
  const data = await res.json()

  if (!data.paymentAuthorizationToken) throw new Error('USPS did not return a payment authorization token')

  // Payment tokens are valid for 8 hours
  _paymentToken = {
    value: data.paymentAuthorizationToken,
    expiresAt: Date.now() + 8 * 60 * 60 * 1000 - 60 * 1000,
  }
  return _paymentToken.value
}

export interface RecipientAddress {
  street: string
  city: string
  state: string
  zip: string
  country?: string
}

// Default parcel — works for booster boxes, blisters, sleeves
const DEFAULT_PARCEL = { weightLbs: 1.5, lengthIn: 12, widthIn: 9, heightIn: 4 }

const SHIPPER = {
  firstName: process.env.USPS_SHIPPER_FIRSTNAME || 'POKE',
  lastName: process.env.USPS_SHIPPER_LASTNAME || 'AUCTION',
  streetAddress: process.env.USPS_SHIPPER_ADDRESS || '7101 Fountainview Circle',
  city: process.env.USPS_SHIPPER_CITY || 'St Charles',
  state: process.env.USPS_SHIPPER_STATE || 'MO',
  ZIPCode: process.env.USPS_SHIPPER_ZIP || '63303',
}

/** Returns USPS Ground Advantage rate in USD */
export async function getUspsRate(recipient: RecipientAddress): Promise<number> {
  const token = await getUspsToken()

  const body = {
    originZIPCode: SHIPPER.ZIPCode,
    destinationZIPCode: recipient.zip.replace(/\D/g, '').slice(0, 5),
    weight: DEFAULT_PARCEL.weightLbs,
    length: DEFAULT_PARCEL.lengthIn,
    width: DEFAULT_PARCEL.widthIn,
    height: DEFAULT_PARCEL.heightIn,
    mailClass: 'USPS_GROUND_ADVANTAGE',
    processingCategory: 'MACHINABLE',
    rateIndicator: 'SP',
    destinationEntryFacilityType: 'NONE',
    priceType: 'RETAIL',
  }

  const res = await fetch(`${USPS_BASE}/prices/v3/base-rates/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error(`USPS rate error: ${await res.text()}`)
  const data = await res.json()

  const price = data.totalBasePrice
  if (price == null) throw new Error('USPS did not return a rate')
  return parseFloat(price)
}

export interface LabelResult {
  trackingNumber: string
  labelBase64: string // base64-encoded PDF
}

/** Creates a USPS Ground Advantage shipment and returns tracking number + printable label (base64 PDF) */
export async function createUspsLabel(
  recipient: {
    name: string
    phone: string
    email: string
    address: RecipientAddress
  },
  _itemDescription: string,
): Promise<LabelResult> {
  const token = await getUspsToken()
  const paymentToken = await getPaymentToken(token)

  const nameParts = recipient.name.trim().split(' ')
  const firstName = nameParts[0]
  const lastName = nameParts.slice(1).join(' ') || 'Customer'

  const body = {
    imageInfo: {
      imageType: 'PDF',
      labelType: '4X6LABEL',
      receiptOption: 'NONE',
    },
    toAddress: {
      firstName,
      lastName,
      streetAddress: recipient.address.street,
      city: recipient.address.city,
      state: recipient.address.state,
      ZIPCode: recipient.address.zip.replace(/\D/g, '').slice(0, 5),
    },
    fromAddress: SHIPPER,
    packageDescription: {
      mailClass: 'USPS_GROUND_ADVANTAGE',
      rateIndicator: 'SP',
      weightUOM: 'lb',
      weight: DEFAULT_PARCEL.weightLbs,
      dimensionsUOM: 'in',
      length: DEFAULT_PARCEL.lengthIn,
      width: DEFAULT_PARCEL.widthIn,
      height: DEFAULT_PARCEL.heightIn,
      processingCategory: 'MACHINABLE',
      mailingDate: new Date().toISOString().split('T')[0],
      extraServices: [],
      destinationEntryFacilityType: 'NONE',
    },
  }

  const res = await fetch(`${USPS_BASE}/labels/v3/label`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Payment-Authorization-Token': paymentToken,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error(`USPS label error: ${await res.text()}`)

  // USPS returns a multipart response: part 1 = JSON metadata, part 2 = base64 label PDF
  const contentType = res.headers.get('content-type') ?? ''
  const boundaryMatch = contentType.match(/boundary=([^;]+)/)
  if (!boundaryMatch) throw new Error('USPS response missing multipart boundary')
  const boundary = boundaryMatch[1].trim()

  const raw = await res.text()
  const parts = raw.split(`--${boundary}`).filter((p) => p.trim() && p.trim() !== '--')

  let trackingNumber = ''
  let labelBase64 = ''

  for (const part of parts) {
    const [headers, ...bodyLines] = part.split('\r\n\r\n')
    const body = bodyLines.join('\r\n\r\n').trim()
    if (headers.includes('name="labelMetadata"') || headers.includes('application/json')) {
      const meta = JSON.parse(body)
      trackingNumber = meta.trackingNumber
    } else if (
      headers.includes('name="labelImage"') ||
      headers.includes('application/pdf') ||
      headers.includes('application/octet-stream')
    ) {
      labelBase64 = body.replace(/\s/g, '')
    }
  }

  if (!trackingNumber) throw new Error('USPS did not return a tracking number')

  return { trackingNumber, labelBase64 }
}
