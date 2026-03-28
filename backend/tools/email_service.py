import smtplib, os
from email.message import EmailMessage
from loguru import logger

async def send_hiring_email(to_email, subject, body, resume_path):
    try:
        msg = EmailMessage()
        msg['Subject'] = subject
        msg['From'] = os.getenv("GMAIL_USER")
        msg['To'] = to_email
        msg.set_content(body)

        # 1. ATTACHMENT LOGIC
        if resume_path and os.path.exists(resume_path):
            with open(resume_path, 'rb') as f:
                file_data = f.read()
                msg.add_attachment(
                    file_data, 
                    maintype='application', 
                    subtype='pdf', 
                    filename='Resume_Application.pdf'
                )
        else:
            logger.warning(f"ATTACHMENT_MISSING: Path {resume_path} not found.")

        # 2. DISPATCH (Using STARTTLS for port 587 - more reliable for Gmail)
        # Note: We use a 'with' block to ensure the connection closes even if it fails
        with smtplib.SMTP('smtp.gmail.com', 587) as smtp:
            smtp.starttls()  # Upgrade to secure connection
            smtp.login(os.getenv("GMAIL_USER"), os.getenv("GMAIL_APP_PASSWORD"))
            smtp.send_message(msg)
            
        logger.info(f"EMAIL_DISPATCH_SUCCESS: Sent to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"EMAIL_DISPATCH_FAILED: {str(e)}")
        # Check for specific GMAIL errors to help you debug
        if "Authentication failed" in str(e):
            logger.error("HINT: Check if your GMAIL_APP_PASSWORD is correct and 2FA is on.")
        return False