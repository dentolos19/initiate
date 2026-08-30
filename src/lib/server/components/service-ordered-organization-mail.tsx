import { BaseMail } from "./base-mail.js";

export default function ServiceOrderedOrganizationMail(props: {
  organizationName: string;
  contactName: string;
  serviceName: string;
  serviceProvider: string;
  orderDate: string;
  orderNumber: string;
  amount: string;
  estimatedCompletion?: string;
}) {
  return (
    <BaseMail title={"Organization Service Order Confirmation"} greeting={`Hello ${props.contactName},`}>
      <p style={{ color: "#34495e", fontSize: "16px", lineHeight: "1.6" }}>
        We're pleased to confirm that a service order has been placed for {props.organizationName}.
      </p>

      <div style={{ backgroundColor: "#ecf0f1", padding: "20px", borderRadius: "6px", margin: "20px 0" }}>
        <h2 style={{ color: "#2c3e50", fontSize: "18px", marginBottom: "15px" }}>Order Details</h2>
        <p style={{ margin: "8px 0", color: "#34495e" }}>
          <strong>Organization:</strong> {props.organizationName}
        </p>
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
        The service provider will reach out to coordinate the implementation. You can monitor progress through your
        organization dashboard.
      </p>
    </BaseMail>
  );
}
