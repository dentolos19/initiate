import { BaseMail } from "./base-mail.js";

export default function ServiceCompletedMail(props: {
  userName: string;
  serviceName: string;
  serviceProvider: string;
  orderNumber: string;
  completionDate: string;
  deliverables?: string[];
  reviewLink?: string;
}) {
  return (
    <BaseMail title={"Service Completed Successfully! 🎉"} titleColor={"#27ae60"} greeting={`Hello ${props.userName},`}>
      <p style={{ color: "#34495e", fontSize: "16px", lineHeight: "1.6" }}>
        Congratulations! Your service has been completed successfully.
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
        <h2 style={{ color: "#2c3e50", fontSize: "18px", marginBottom: "15px" }}>Completion Summary</h2>
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
          <strong>Completion Date:</strong> {props.completionDate}
        </p>
      </div>

      {props.deliverables && props.deliverables.length > 0 && (
        <div style={{ backgroundColor: "#ecf0f1", padding: "20px", borderRadius: "6px", margin: "20px 0" }}>
          <h2 style={{ color: "#2c3e50", fontSize: "18px", marginBottom: "15px" }}>Deliverables</h2>
          {props.deliverables.map((deliverable, index) => (
            <p key={index} style={{ margin: "8px 0", color: "#34495e" }}>
              • {deliverable}
            </p>
          ))}
        </div>
      )}

      <p style={{ color: "#34495e", fontSize: "16px", lineHeight: "1.6" }}>
        All deliverables are now available in your dashboard. Thank you for choosing our platform!
      </p>

      {props.reviewLink && (
        <div
          style={{
            backgroundColor: "#74b9ff",
            padding: "15px",
            borderRadius: "6px",
            margin: "20px 0",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#ffffff", fontSize: "16px", margin: "0" }}>
            <strong>Help others by leaving a review!</strong>
          </p>
          <a href={props.reviewLink} style={{ color: "#ffffff", fontSize: "14px", textDecoration: "underline" }}>
            Share your experience
          </a>
        </div>
      )}
    </BaseMail>
  );
}
