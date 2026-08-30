import { BaseMail } from "./base-mail.js";

export default function ServiceConfirmedMail(props: {
  userName: string;
  serviceName: string;
  serviceProvider: string;
  orderNumber: string;
  startDate: string;
  estimatedCompletion: string;
  providerContact?: string;
  nextSteps?: string;
}) {
  return (
    <BaseMail title={"Service Confirmed & Starting Soon"} titleColor={"#27ae60"} greeting={`Hello ${props.userName},`}>
      <p style={{ color: "#34495e", fontSize: "16px", lineHeight: "1.6" }}>
        Great news! Your service has been confirmed and is ready to begin.
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
        <h2 style={{ color: "#2c3e50", fontSize: "18px", marginBottom: "15px" }}>Service Timeline</h2>
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
          <strong>Start Date:</strong> {props.startDate}
        </p>
        <p style={{ margin: "8px 0", color: "#34495e" }}>
          <strong>Estimated Completion:</strong> {props.estimatedCompletion}
        </p>
        {props.providerContact && (
          <p style={{ margin: "8px 0", color: "#34495e" }}>
            <strong>Provider Contact:</strong> {props.providerContact}
          </p>
        )}
      </div>

      {props.nextSteps && (
        <div style={{ backgroundColor: "#ecf0f1", padding: "20px", borderRadius: "6px", margin: "20px 0" }}>
          <h2 style={{ color: "#2c3e50", fontSize: "18px", marginBottom: "15px" }}>Next Steps</h2>
          <p style={{ color: "#34495e", fontSize: "16px", lineHeight: "1.6" }}>{props.nextSteps}</p>
        </div>
      )}

      <p style={{ color: "#34495e", fontSize: "16px", lineHeight: "1.6" }}>
        You can track the progress of your service in your dashboard. We'll keep you updated throughout the process.
      </p>
    </BaseMail>
  );
}
