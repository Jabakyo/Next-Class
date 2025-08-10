// Email service for sending notifications
import nodemailer from 'nodemailer'

// Helper function to format time to New York timezone
function formatTimeForEmail(timeString: string) {
  const [hours, minutes] = timeString.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  
  return date.toLocaleTimeString("en-US", {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/New_York'
  })
}

// Helper function to format date to New York timezone
function formatDateForEmail(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { 
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/New_York'
  })
}

// Email configuration - you'll need to set these environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER, // your email
    pass: process.env.SMTP_PASS, // your email password or app password
  },
})

// Email templates
export const emailTemplates = {
  passwordReset: (resetLink: string) => ({
    subject: 'NC Portal - Password Reset',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Password Reset</h2>
        <p>We received a request to reset your password.</p>
        <p>Click the link below to set a new password:</p>
        <div style="margin: 20px 0;">
          <a href="${resetLink}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          This link is valid for 24 hours.<br>
          If you didn't request this, please ignore this email.
        </p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">NC Portal - Class Schedule Sharing</p>
      </div>
    `
  }),

  verificationApproved: (dashboardLink: string) => ({
    subject: 'NC Portal - Schedule Verification Approved ✅',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">✅ Schedule Verification Complete</h2>
        <p>Congratulations! Your class schedule has been verified.</p>
        <p>You can now browse other students' schedules and find classmates.</p>
        <div style="margin: 20px 0;">
          <a href="${dashboardLink}" 
             style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Open Dashboard
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          You can view other students' schedules through "Browse Schedules".
        </p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">NC Portal - Class Schedule Sharing</p>
      </div>
    `
  }),

  verificationRejected: (data: { dashboardLink: string, reason?: string }) => ({
    subject: 'NC Portal - Schedule Verification: Resubmission Required',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">⚠️ Schedule Verification: Please Resubmit</h2>
        <p>We were unable to verify your submitted schedule.</p>
        ${data.reason ? `<p style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; margin: 16px 0;"><strong>Reason:</strong> ${data.reason}</p>` : ''}
        <p>Please check the following and resubmit:</p>
        <ul style="color: #666;">
          <li>Screenshot is clear and readable</li>
          <li>All class information is visible</li>
          <li>Shows current semester schedule</li>
        </ul>
        <div style="margin: 20px 0;">
          <a href="${data.dashboardLink}" 
             style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Resubmit
          </a>
        </div>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">NC Portal - Class Schedule Sharing</p>
      </div>
    `
  }),

  eventCancellation: (event: any) => ({
    subject: `NC Portal - Event Cancelled: ${event.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">🚫 Event Cancelled</h2>
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <h3 style="margin: 0 0 8px 0; color: #dc2626;">${event.title}</h3>
          <p style="margin: 4px 0; color: #666;"><strong>Date:</strong> ${formatDateForEmail(event.date)} ${formatTimeForEmail(event.time)}${event.endTime ? ` - ${formatTimeForEmail(event.endTime)}` : ''} (ET)</p>
          ${event.duration ? `<p style="margin: 4px 0; color: #666;"><strong>Duration:</strong> ${event.duration === 1 ? '1 hour' : `${event.duration} hours`}</p>` : ''}
          <p style="margin: 4px 0; color: #666;"><strong>Location:</strong> ${event.location}</p>
          ${event.description ? `<p style="margin: 8px 0 0 0; color: #666;">${event.description}</p>` : ''}
        </div>
        <p>This event has been cancelled by the organizer.</p>
        <p style="color: #666; font-size: 14px;">
          We apologize for any inconvenience.
        </p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">NC Portal - Class Schedule Sharing</p>
      </div>
    `
  }),

  eventInvitation: (event: any, inviterName: string, eventLink: string) => ({
    subject: `NC Portal - Event Invitation: ${event.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">📅 You're Invited to an Event</h2>
        <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <h3 style="margin: 0 0 8px 0; color: #2563eb;">${event.title}</h3>
          <p style="margin: 4px 0; color: #666;"><strong>Date:</strong> ${formatDateForEmail(event.date)} ${formatTimeForEmail(event.time)}${event.endTime ? ` - ${formatTimeForEmail(event.endTime)}` : ''} (ET)</p>
          ${event.duration ? `<p style="margin: 4px 0; color: #666;"><strong>Duration:</strong> ${event.duration === 1 ? '1 hour' : `${event.duration} hours`}</p>` : ''}
          <p style="margin: 4px 0; color: #666;"><strong>Location:</strong> ${event.location}</p>
          <p style="margin: 4px 0; color: #666;"><strong>Organizer:</strong> ${inviterName}</p>
          ${event.description ? `<p style="margin: 8px 0 0 0; color: #666;">${event.description}</p>` : ''}
        </div>
        <div style="margin: 20px 0;">
          <a href="${eventLink}" 
             style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">
            Join Event
          </a>
          <a href="${eventLink}" 
             style="background-color: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Details
          </a>
        </div>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">NC Portal - Class Schedule Sharing</p>
      </div>
    `
  }),

  eventReminder: (event: any) => ({
    subject: `NC Portal - Event Tomorrow: ${event.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">⏰ Event Reminder - Tomorrow</h2>
        <div style="background-color: #fffbeb; border: 1px solid #fde68a; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <h3 style="margin: 0 0 8px 0; color: #f59e0b;">${event.title}</h3>
          <p style="margin: 4px 0; color: #666;"><strong>Date:</strong> ${formatDateForEmail(event.date)} ${formatTimeForEmail(event.time)}${event.endTime ? ` - ${formatTimeForEmail(event.endTime)}` : ''} (ET)</p>
          ${event.duration ? `<p style="margin: 4px 0; color: #666;"><strong>Duration:</strong> ${event.duration === 1 ? '1 hour' : `${event.duration} hours`}</p>` : ''}
          <p style="margin: 4px 0; color: #666;"><strong>Location:</strong> ${event.location}</p>
          ${event.description ? `<p style="margin: 8px 0 0 0; color: #666;">${event.description}</p>` : ''}
        </div>
        <p>Don't forget about your event tomorrow!</p>
        <p style="color: #666; font-size: 14px;">
          Looking forward to seeing you there!
        </p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">NC Portal - Class Schedule Sharing</p>
      </div>
    `
  }),

  emailVerification: (verificationLink: string) => ({
    subject: 'NC Portal - Email Verification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">🎓 Welcome to NC!</h2>
        <p>Thank you for registering with NC Portal.</p>
        <p>Click the button below to verify your email address and complete your account creation:</p>
        <div style="margin: 30px 0;">
          <a href="${verificationLink}" 
             style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          This link is valid for 24 hours.<br>
          If you didn't request this, please ignore this email.
        </p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">NC Portal - Class Schedule Sharing</p>
      </div>
    `
  }),

  adminVerificationNotification: (data: { userName: string, userEmail: string, studentId: string, submittedAt: string, dashboardLink: string }) => ({
    subject: `🔍 New Schedule Verification Request - ${data.userName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">🔍 New Schedule Verification Request</h2>
        <p>A new schedule verification request has been submitted and requires your review.</p>
        
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 6px;">
          <h3 style="margin: 0 0 12px 0; color: #92400e;">Student Information:</h3>
          <p style="margin: 4px 0; color: #92400e;"><strong>Name:</strong> ${data.userName}</p>
          <p style="margin: 4px 0; color: #92400e;"><strong>Email:</strong> ${data.userEmail}</p>
          <p style="margin: 4px 0; color: #92400e;"><strong>Student ID:</strong> ${data.studentId}</p>
          <p style="margin: 4px 0; color: #92400e;"><strong>Submitted:</strong> ${new Date(data.submittedAt).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/New_York'
          })} (ET)</p>
        </div>

        <p style="color: #666; font-size: 14px; margin: 16px 0;">
          <strong>Action Required:</strong> Please review the submitted schedule screenshot and approve or reject the verification request.
        </p>

        <div style="margin: 30px 0;">
          <a href="${data.dashboardLink}" 
             style="background-color: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            Review Request in Admin Dashboard
          </a>
        </div>

        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #374151; font-size: 14px;">
            <strong>Quick Actions:</strong><br>
            • Review the submitted screenshot for clarity and accuracy<br>
            • Verify that all class information is visible<br>
            • Check that the schedule matches current semester requirements<br>
            • Approve or reject with appropriate feedback
          </p>
        </div>

        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">
          NC Portal - Admin Notification System<br>
          This is an automated notification for schedule verification requests.
        </p>
      </div>
    `
  })
}

// Main email sending function
export async function sendEmail(to: string, template: keyof typeof emailTemplates, data: any = {}) {
  try {
    // Check if email service is properly configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('Email service not configured: Missing SMTP_USER or SMTP_PASS environment variables')
      console.log(`[DEVELOPMENT MODE] Would send email to ${to}:`, {
        template,
        data,
        subject: emailTemplates[template](data).subject
      })
      // Return success in development mode to not break the flow
      return {
        success: true,
        message: 'Email simulated (development mode)',
        to: to,
        template: template
      }
    }

    const emailContent = emailTemplates[template](data)
    
    const mailOptions = {
      from: `"NC Portal" <${process.env.SMTP_USER}>`,
      to: to,
      subject: emailContent.subject,
      html: emailContent.html,
    }

    console.log(`🚀 Attempting to send email to ${to} with subject: ${emailContent.subject}`)
    console.log('📧 Mail options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      htmlLength: mailOptions.html.length
    })
    
    const result = await transporter.sendMail(mailOptions)
    console.log('✅ Email sent successfully:', {
      messageId: result.messageId,
      to: to,
      subject: emailContent.subject,
      response: result.response,
      accepted: result.accepted,
      rejected: result.rejected
    })
    
    return { success: true, messageId: result.messageId }
  } catch (error: any) {
    console.error('Error sending email:', {
      error: error.message,
      to: to,
      template: template,
      stack: error.stack
    })
    
    // In development, log the error but don't break the flow
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`[DEVELOPMENT MODE] Email send failed but continuing:`, {
        to,
        template,
        error: error.message
      })
      return {
        success: true,
        message: 'Email simulated (development mode - error handled)',
        to: to,
        template: template
      }
    }
    
    return { 
      success: false, 
      error: error.message,
      code: error.code,
      details: error.response
    }
  }
}

// Specific email functions for easy usage
export const emailService = {
  // Password reset email
  sendPasswordReset: async (email: string, resetToken: string) => {
    const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${resetToken}`
    return sendEmail(email, 'passwordReset', resetLink)
  },

  // Verification status emails
  sendVerificationApproved: async (email: string) => {
    const dashboardLink = `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`
    return sendEmail(email, 'verificationApproved', dashboardLink)
  },

  sendVerificationRejected: async (email: string, reason?: string) => {
    const dashboardLink = `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`
    return sendEmail(email, 'verificationRejected', { dashboardLink, reason })
  },

  // Event emails
  sendEventCancellation: async (attendeeEmails: string[], event: any) => {
    const results = []
    for (const email of attendeeEmails) {
      const result = await sendEmail(email, 'eventCancellation', event)
      results.push({ email, ...result })
    }
    return results
  },

  sendEventInvitation: async (inviteeEmails: string[], event: any, inviterName: string) => {
    const eventLink = `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`
    const results = []
    for (const email of inviteeEmails) {
      const result = await sendEmail(email, 'eventInvitation', { event, inviterName, eventLink })
      results.push({ email, ...result })
    }
    return results
  },

  // Email verification
  sendEmailVerification: async (email: string, verificationToken: string) => {
    const verificationLink = `${process.env.NEXT_PUBLIC_BASE_URL}/verify-email?token=${verificationToken}`
    return sendEmail(email, 'emailVerification', verificationLink)
  },

  sendEventReminder: async (attendeeEmails: string[], event: any) => {
    const results = []
    for (const email of attendeeEmails) {
      const result = await sendEmail(email, 'eventReminder', event)
      results.push({ email, ...result })
    }
    return results
  }
}

// Email queue for better performance (optional)
export class EmailQueue {
  private queue: Array<{ to: string; template: string; data: any }> = []
  private isProcessing = false

  add(to: string, template: keyof typeof emailTemplates, data: any = {}) {
    this.queue.push({ to, template, data })
    if (!this.isProcessing) {
      this.process()
    }
  }

  private async process() {
    this.isProcessing = true
    
    while (this.queue.length > 0) {
      const emailJob = this.queue.shift()
      if (emailJob) {
        try {
          await sendEmail(emailJob.to, emailJob.template as keyof typeof emailTemplates, emailJob.data)
          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000))
        } catch (error) {
          console.error('Failed to send queued email:', error)
        }
      }
    }
    
    this.isProcessing = false
  }
}

// Global email queue instance
export const emailQueue = new EmailQueue()