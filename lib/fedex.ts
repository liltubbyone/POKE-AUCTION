const FEDEX_BASE =
  process.env.FEDEX_ENV === 'production'
    ? 'https://apis.fedex.com'
    : 'https://apis-sandbox.fedex.com'

// Token cache — FedEx tokens last ~1 hour
let _token: { value: string; expiresAt: number } | null = null

export async function getFedexToken(): Promise<string> {
  if (_token && Date.now() < _token.expiresAt) return _token.value

  const res = await fetch(`${FEDEX_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.FEDEX_API_KEY!,
      client_secret: process.env.FEDEX_SECRET_KEY!,
    }),
  })

  if (!res.ok) throw new Error(`FedEx auth failed: ${await res.text()}`)
  const data = await res.json()

  _token = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }
  return _token.value
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

const SHIPPER_ADDRESS = {
  streetLines: [process.env.FEDEX_SHIPPER_ADDRESS || '7101 Fountainview Circle'],
  city: process.env.FEDEX_SHIPPER_CITY || 'St Charles',
  stateOrProvinceCode: process.env.FEDEX_SHIPPER_STATE || 'MO',
  postalCode: process.env.FEDEX_SHIPPER_ZIP || '63303',
  countryCode: 'US',
}

/** Returns cheapest rate in USD (FedEx Ground preferred) */
export async function getFedexRate(recipient: RecipientAddress): Promise<number> {
  const token = await getFedexToken()

  const body = {
    accountNumber: { value: process.env.FEDEX_ACCOUNT_NUMBER },
    requestedShipment: {
      shipper: { address: SHIPPER_ADDRESS },
      recipient: {
        address: {
          streetLines: [recipient.street],
          city: recipient.city,
          stateOrProvinceCode: recipient.state,
          postalCode: recipient.zip,
          countryCode: recipient.country || 'US',
        },
      },
      pickupType: 'DROPOFF_AT_FEDEX_LOCATION',
      rateRequestType: ['ACCOUNT'],
      requestedPackageLineItems: [
        {
          weight: { units: 'LB', value: DEFAULT_PARCEL.weightLbs },
          dimensions: {
            length: DEFAULT_PARCEL.lengthIn,
            width: DEFAULT_PARCEL.widthIn,
            height: DEFAULT_PARCEL.heightIn,
            units: 'IN',
          },
        },
      ],
    },
  }

  const res = await fetch(`${FEDEX_BASE}/rate/v1/rates/quotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error(`FedEx rate error: ${await res.text()}`)

  const data = await res.json()
  const rates: any[] = data.output?.rateReplyDetails ?? []

  // Prefer Ground, fall back to first available
  const ground = rates.find((r) => r.serviceType === 'FEDEX_GROUND')
  const chosen = ground ?? rates[0]
  if (!chosen) throw new Error('No FedEx rates returned')

  const detail = chosen.ratedShipmentDetails?.[0]
  const charge = detail?.totalNetCharge ?? detail?.totalNetFedExCharge
  if (!charge) throw new Error('Could not parse FedEx rate amount')

  return parseFloat(charge)
}

export interface LabelResult {
  trackingNumber: string
  labelBase64: string // base64-encoded PDF
}

/** Creates a FedEx shipment and returns tracking number + printable label (base64 PDF) */
export async function createFedexLabel(
  recipient: {
    name: string
    phone: string
    email: string
    address: RecipientAddress
  },
  itemDescription: string,
): Promise<LabelResult> {
  const token = await getFedexToken()

  const body = {
    labelResponseOptions: 'LABEL',
    requestedShipment: {
      shipper: {
        contact: {
          personName: process.env.FEDEX_SHIPPER_NAME || 'POKE-AUCTION',
          phoneNumber: process.env.FEDEX_SHIPPER_PHONE || '4174304228',
        },
        address: SHIPPER_ADDRESS,
      },
      recipients: [
        {
          contact: {
            personName: recipient.name,
            phoneNumber: recipient.phone.replace(/\D/g, ''),
            emailAddress: recipient.email,
          },
          address: {
            streetLines: [recipient.address.street],
            city: recipient.address.city,
            stateOrProvinceCode: recipient.address.state,
            postalCode: recipient.address.zip,
            countryCode: recipient.address.country || 'US',
          },
        },
      ],
      shipDatestamp: new Date().toISOString().split('T')[0],
      serviceType: 'FEDEX_GROUND',
      packagingType: 'YOUR_PACKAGING',
      pickupType: 'DROPOFF_AT_FEDEX_LOCATION',
      shippingChargesPayment: {
        paymentType: 'SENDER',
        payor: {
          responsibleParty: {
            accountNumber: { value: process.env.FEDEX_ACCOUNT_NUMBER },
          },
        },
      },
      labelSpecification: {
        labelFormatType: 'COMMON2D',
        imageType: 'PDF',
        labelStockType: 'PAPER_85X11_TOP_HALF_LABEL',
      },
      requestedPackageLineItems: [
        {
          weight: { units: 'LB', value: DEFAULT_PARCEL.weightLbs },
          dimensions: {
            length: DEFAULT_PARCEL.lengthIn,
            width: DEFAULT_PARCEL.widthIn,
            height: DEFAULT_PARCEL.heightIn,
            units: 'IN',
          },
          itemDescription: itemDescription.slice(0, 50),
        },
      ],
    },
    accountNumber: { value: process.env.FEDEX_ACCOUNT_NUMBER },
  }

  const res = await fetch(`${FEDEX_BASE}/ship/v1/shipments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error(`FedEx label error: ${await res.text()}`)

  const data = await res.json()
  const shipment = data.output?.transactionShipments?.[0]
  const trackingNumber = shipment?.masterTrackingNumber
  const labelDoc = shipment?.pieceResponses?.[0]?.packageDocuments?.[0]

  if (!trackingNumber) throw new Error('FedEx did not return a tracking number')

  return {
    trackingNumber,
    labelBase64: labelDoc?.encodedLabel ?? '',
  }
}
