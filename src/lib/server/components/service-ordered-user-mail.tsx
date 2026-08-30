import { BaseMail } from "./base-mail.js";

export default function ServiceOrderedUserMail(props: {
  userName: string;
  serviceName: string;
  serviceProvider: string;
  orderDate: string;
  orderNumber: string;
  amount: string;
  estimatedCompletion?: string;
}) {
  return (
    <BaseMail title={"Service Order Confirmation"} greeting={`Hello ${props.userName},`}>
      <p style={{ color: "#34495e", fontSize: "16px", lineHeight: "1.6" }}>
        Thank you for your order! We're excited to confirm that your service request has been successfully placed.
      </p>

      <div style={{ backgroundColor: "#ecf0f1", padding: "20px", borderRadius: "6px", margin: "20px 0" }}>
        <h2 style={{ color: "#2c3e50", fontSize: "18px", marginBottom: "15px" }}>Order Details</h2>
        <p style={{ margin: "8px 0", color: "#34495e" }}>
          <strong>Service:</strong> {props.serviceName}
        </p>
        <p style={{ margin: "8px 0", color: "#34495e" }}>
          <strong>Provider:</strong> {props.serviceProvider}
        </p>
        <p style={{ margin: "8px 0", color: "#34495e" }}>
          <strong>Order Number:</strong> {props.orderNumber}
        </p>
        <p style={{ margin: "8px 0", color: "#34495e" }}>
          <strong>Order Date:</strong> {props.orderDate}
        </p>
        <p style={{ margin: "8px 0", color: "#34495e" }}>
          <strong>Amount:</strong> ${props.amount}
        </p>
        {props.estimatedCompletion && (
          <p style={{ margin: "8px 0", color: "#34495e" }}>
            <strong>Estimated Completion:</strong> {props.estimatedCompletion}
          </p>
        )}
      </div>

      <p style={{ color: "#34495e", fontSize: "16px", lineHeight: "1.6" }}>
        The service provider will contact you shortly with next steps. You can track your order status in your
        dashboard.
      </p>
    </BaseMail>
  );
}
