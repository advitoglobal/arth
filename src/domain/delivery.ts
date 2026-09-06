export const DELIVERY_LANES = [
  {
    lane: "finance" as const,
    steps: [
      { key: "kyc", label: "KYC" },
      { key: "loan", label: "Loan sanction" },
      { key: "insurance", label: "Insurance issued" },
      { key: "invoice", label: "Invoice" },
    ],
  },
  {
    lane: "vehicle" as const,
    steps: [
      { key: "allocate", label: "Allocate VIN" },
      { key: "pdi", label: "PDI" },
      { key: "rto", label: "RTO" },
      { key: "number", label: "Number plate" },
    ],
  },
  {
    lane: "prep" as const,
    steps: [
      { key: "accessories", label: "Accessories" },
      { key: "clean", label: "Clean and fuel" },
      { key: "handover_kit", label: "Handover kit" },
      { key: "delivery", label: "Physical delivery" },
    ],
  },
];
