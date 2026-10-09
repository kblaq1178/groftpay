import type { Metadata } from "next";

import { trimAmount } from "@/lib/format";
import { decodePaymentRequest } from "@/lib/payment-request";
import { InvalidLink } from "./invalid-link";
import { PayClient } from "./pay-client";

type PayPageProps = PageProps<"/pay/[id]">;

export async function generateMetadata(props: PayPageProps): Promise<Metadata> {
  const { id } = await props.params;
  const decoded = decodePaymentRequest(id);

  if (!decoded.ok) {
    return {
      title: "Payment request unavailable",
      description: "This GroftPay link could not be opened.",
      robots: { index: false, follow: false },
    };
  }

  const amount = `${trimAmount(decoded.request.amount)} CC`;
  const purpose = decoded.request.memo ? ` for ${decoded.request.memo}` : "";
  return {
    title: `Pay ${amount}`,
    description: decoded.request.receiverName
      ? `${decoded.request.receiverName} requested ${amount}${purpose} on Canton.`
      : `A Canton party requested ${amount}${purpose} through GroftPay.`,
    robots: { index: false, follow: false },
  };
}

export default async function PayPage(props: PayPageProps) {
  const { id } = await props.params;
  const decoded = decodePaymentRequest(id);

  if (!decoded.ok) {
    return <InvalidLink reason={decoded.reason} />;
  }

  return <PayClient request={decoded.request} />;
}
