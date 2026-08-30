export default function BasicMail(props: { title: string; content: string }) {
  return (
    <div>
      <div
        style={{
          fontFamily: "Arial, sans-serif",
          maxWidth: "600px",
          margin: "0 auto",
          padding: "20px",
          backgroundColor: "#f9f9f9",
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "30px",
            borderRadius: "8px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <h1 style={{ color: "#2c3e50", fontSize: "24px", marginBottom: "20px" }}>{props.title}</h1>
          <p style={{ color: "#34495e", fontSize: "16px", lineHeight: "1.6" }}>{props.content}</p>
          <p style={{ color: "#7f8c8d", fontSize: "14px", marginTop: "30px" }}>
            Best regards,
            <br />
            The Initiate Platform Team
          </p>
        </div>
      </div>
    </div>
  );
}
