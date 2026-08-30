import { BaseMail } from "./base-mail.js";

export default function InvoicePaidMail(props: {
  userName: string;
  invoiceNumber: string;
  amount: string;
  paymentDate: string;
  paymentMethod: string;
  serviceName?: string;
  transactionId?: string;
  receiptUrl?: string;
}) {
  return (
    <BaseMail title={"Payment Received - Thank You!"} titleColor={"#27ae60"} greeting={`Hello ${props.userName},`}>
      <p style={{ color: "#34495e", fontSize: "16px", lineHeight: "1.6" }}>
        Thank you for your payment. We've successfully processed your invoice.
      </p>

      <div
        style={{
          backgroundColor: "#d5f4e6",
          padding: "20px",
          borderRadius: "6px",
          margin: "20px 0",
          border: "2px solid #00b894",
        }}
      >
        <h2 style={{ color: "#2c3e50", fontSize: "18px", marginBottom: "15px" }}>Payment Details</h2>
        <p style={{ margin: "8px 0", color: "#34495e" }}>
          <strong>Invoice Number:</strong> {props.invoiceNumber}
        </p>
        <p style={{ margin: "8px 0", color: "#34495e" }}>
          <strong>Amount Paid:</strong> ${props.amount}
        </p>
        <p style={{ margin: "8px 0", color: "#34495e" }}>
          <strong>Payment Date:</strong> {props.paymentDate}
        </p>
        <p style={{ margin: "8px 0", color: "#34495e" }}>
          <strong>Payment Method:</strong> {props.paymentMethod}
        </p>
        {props.serviceName && (
          <p style={{ margin: "8px 0", color: "#34495e" }}>
            <strong>Service:</strong> {props.serviceName}
          </p>
        )}
        {props.transactionId && (
          <p style={{ margin: "8px 0", color: "#34495e" }}>
            <strong>Transaction ID:</strong> {props.transactionId}
          </p>
        )}
      </div>

      <p style={{ color: "#34495e", fontSize: "16px", lineHeight: "1.6" }}>
        Your account has been updated and any related services will proceed as scheduled.
      </p>

      {props.receiptUrl && (
        <div
          style={{
            backgroundColor: "#ecf0f1",
            padding: "15px",
            borderRadius: "6px",
            margin: "20px 0",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#34495e", fontSize: "16px", margin: "0" }}>
            <strong>Need a receipt?</strong>
          </p>
          <a href={props.receiptUrl} style={{ color: "#3498db", fontSize: "14px", textDecoration: "underline" }}>
            Download your receipt
          </a>
        </div>
      )}
    </BaseMail>
  );
}
