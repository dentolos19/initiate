import { BaseMail } from "./base-mail.js";

export default function ServiceCancelledMail(props: {
  userName: string;
  serviceName: string;
  orderNumber: string;
  cancellationReason?: string;
  refundAmount?: string;
  refundTimeline?: string;
}) {
  return (
    <BaseMail title={"Service Order Cancelled"} titleColor={"#e74c3c"} greeting={`Hello ${props.userName},`}>
      <p style={{ color: "#34495e", fontSize: "16px", lineHeight: "1.6" }}>
        We're writing to inform you that your service order has been cancelled.
      </p>

      <div
        style={{
          backgroundColor: "#ffeaa7",
          padding: "20px",
          borderRadius: "6px",
          margin: "20px 0",
          border: "2px solid #fdcb6e",
        }}
      >
        <h2 style={{ color: "#2c3e50", fontSize: "18px", marginBottom: "15px" }}>Cancellation Details</h2>
        <p style={{ margin: "8px 0", color: "#34495e" }}>
          <strong>Service:</strong> {props.serviceName}
        </p>
        <p style={{ margin: "8px 0", color: "#34495e" }}>
          <strong>Order Number:</strong> {props.orderNumber}
        </p>
        {props.cancellationReason && (
          <p style={{ margin: "8px 0", color: "#34495e" }}>
            <strong>Reason:</strong> {props.cancellationReason}
          </p>
        )}
      </div>

      {props.refundAmount && (
        <div
          style={{
            backgroundColor: "#d5f4e6",
            padding: "20px",
            borderRadius: "6px",
            margin: "20px 0",
            border: "2px solid #00b894",
          }}
        >
          <h2 style={{ color: "#2c3e50", fontSize: "18px", marginBottom: "15px" }}>Refund Information</h2>
          <p style={{ margin: "8px 0", color: "#34495e" }}>
            <strong>Refund Amount:</strong> ${props.refundAmount}
          </p>
          {props.refundTimeline && (
            <p style={{ margin: "8px 0", color: "#34495e" }}>
              <strong>Expected Processing Time:</strong> {props.refundTimeline}
            </p>
          )}
        </div>
      )}

      <p style={{ color: "#34495e", fontSize: "16px", lineHeight: "1.6" }}>
        If you have any questions about this cancellation, please don't hesitate to contact our support team.
      </p>
    </BaseMail>
  );
}
