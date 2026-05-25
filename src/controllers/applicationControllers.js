// import Application from "../models/applicationModel.js";
// import mongoose from "mongoose";

// // ✅ Create Application & Send to Google Sheets
// export const createApplication = async (req, res) => {
//   try {
//     const { fullName, email, phone, course, gender, address } = req.body;

//     // 🔴 Validation
//     if (!fullName || !email || !phone || !course) {
//       return res.status(400).json({
//         success: false,
//         message: "All required fields must be filled",
//       });
//     }

//     // 🔴 ObjectId check
//     if (!mongoose.Types.ObjectId.isValid(course)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid course ID",
//       });
//     }

//     // 🔴 Duplicate email check
//     const existing = await Application.findOne({ email });
//     if (existing) {
//       return res.status(400).json({
//         success: false,
//         message: "Application already submitted with this email",
//       });
//     }

//     // 1. Save to MongoDB
//     const application = await Application.create({
//       fullName,
//       email,
//       phone,
//       course,
//       gender,
//       address,
//     });

//     // 2. Fetch the populated application to get Course Title for Google Sheets
//     const populatedApp = await Application.findById(application._id).populate("course");

//     // 3. 🔥 Forward to Google Sheets (Silent Background Request)
//     // const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbw0U4QhCJm7-W1Jfsy2Kl-Z9NLtPN4MLZvE7jz1Gb6ANuG1SbRziK-dp4Ni9yvBNFY/exec";
//     const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyEuGmN5urqYzxr8dTj_KXkZI5Oo_6l1ECSPpjdDaqHt5Djn7VgIWdAdC0rLJZI-ZWm/exec";

//     fetch(GOOGLE_SHEET_URL, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         fullName,
//         email,
//         phone,
//         course: populatedApp.course ? populatedApp.course.title : "Unknown Course",
//         gender,
//         address,
//         appliedAt: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
//       }),
//     }).catch((err) => console.error("Google Sheet Error:", err));

//     // 4. Send Immediate Success Response
//     res.status(201).json({
//       success: true,
//       message: "Application submitted successfully",
//       data: application,
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message,
//     });
//   }
// };

import Application from "../models/applicationModel.js";
import mongoose from "mongoose";
import nodemailer from "nodemailer";

// ✅ Create Application & Send to Google Sheets and Emails
export const createApplication = async (req, res) => {
  console.log("--- START: New Application Request ---");
  
  try {
    const { fullName, email, phone, course, gender, address } = req.body;

    // 🔴 1. Validation
    if (!fullName || !email || !phone || !course) {
      return res.status(400).json({ success: false, message: "All required fields must be filled" });
    }

    if (!mongoose.Types.ObjectId.isValid(course)) {
      return res.status(400).json({ success: false, message: "Invalid course ID" });
    }

    // const existing = await Application.findOne({ email });
    // if (existing) {
    //   return res.status(400).json({ success: false, message: "Application already submitted with this email" });
    // }

    // 🔴 2. Save to MongoDB
    const application = await Application.create({ fullName, email, phone, course, gender, address });
    const populatedApp = await Application.findById(application._id).populate("course");
    const courseTitle = populatedApp.course ? populatedApp.course.title : "Unknown Course";
    console.log("Step 2 Success: Saved to MongoDB");

    // 🔴 3. Forward to Google Sheets
    const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyEuGmN5urqYzxr8dTj_KXkZI5Oo_6l1ECSPpjdDaqHt5Djn7VgIWdAdC0rLJZI-ZWm/exec";
    
    fetch(GOOGLE_SHEET_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName, email, phone, course: courseTitle, gender, address,
        appliedAt: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      }),
    })
    .then(() => console.log("Step 3 Success: Google Sheets updated"))
    .catch((err) => console.error("Step 3 Error:", err.message));

    // 🔴 4. Setup Nodemailer (Using your Gmail)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "mohdsaquib619@gmail.com", // Aapka sender email
        pass: process.env.EMAIL_PASS,   // Gmail 16-digit App Password
      },
    });

    // 📧 5a. Student Confirmation Mail
    const studentMailOptions = {
      from: `"Rattan Institute" <mohdsaquib619@gmail.com>`,
      to: email, // Jo student ne form mein bhara
      subject: `Application Received - ${courseTitle}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #2c3e50;">Hello ${fullName},</h2>
          <p>Thank you for applying at <strong>Rattan Institute (RIME)</strong>.</p>
          <p>We have received your application for the <strong>${courseTitle}</strong> course.</p>
          <hr />
          <p>Our team will review your details and get back to you shortly.</p>
          <p>Best Regards,<br/>Admission Team<br/>RIME</p>
        </div>
      `,
    };

    // 📧 5b. Client (Admin) Notification Mail
    const adminMailOptions = {
      from: `"RIME Web Portal" <mohdsaquib619@gmail.com>`,
      to: "mohdsaquib619@gmail.com", // Aapke client ka mail
      subject: `New Lead: ${fullName} applied for ${courseTitle}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #2980b9;">New Student Inquiry</h2>
          <p>Neeche naye student ki details hain:</p>
          <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #ddd;">
            <p><b>Name:</b> ${fullName}</p>
            <p><b>Email:</b> ${email}</p>
            <p><b>Phone:</b> ${phone}</p>
            <p><b>Course:</b> ${courseTitle}</p>
            <p><b>Gender:</b> ${gender}</p>
            <p><b>Address:</b> ${address}</p>
          </div>
          <p style="font-size: 12px; color: #7f8c8d; margin-top: 10px;">Data saved in MongoDB & Google Sheets.</p>
        </div>
      `,
    };

    // Mail bhejna
    transporter.sendMail(studentMailOptions); // Student ko
    transporter.sendMail(adminMailOptions, (err, info) => { // Client ko
      if (err) console.error("Admin Email Error:", err.message);
      else console.log("Step 5 Success: Admin Notified!");
    });

    // 🔴 6. Final Response
    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
    });

  } catch (error) {
    console.error("CRITICAL ERROR:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ Get All Applications (Admin)
export const getApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate("course")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ✅ Delete Application
export const deleteApplication = async (req, res) => {
  try {
    const deleted = await Application.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    res.json({
      success: true,
      message: "Application deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Delete failed",
      error: error.message,
    });
  }
};

// ✅ Update Application
export const updateApplication = async (req, res) => {
  try {
    const allowedFields = ["fullName", "email", "phone", "course", "gender", "address"];

    const updates = {};
    for (let key of allowedFields) {
      if (req.body[key]) updates[key] = req.body[key];
    }

    const updated = await Application.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).populate("course");

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    res.json({
      success: true,
      message: "Application updated successfully",
      data: updated,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Update failed",
      error: error.message,
    });
  }
};



// import Application from "../models/applicationModel.js";

// export const createApplication = async (req, res) => {
//   try {
//     const {
//       personalInformation,
//       academicInformation,
//       programApplied,
//       addressInformation
//     } = req.body;

//     const application = await Application.create({
//       personalInformation,
//       academicInformation,
//       programApplied,
//       addressInformation
//     });

//     res.status(201).json({
//       success: true,
//       message: "Application submitted successfully",
//       application
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// };

// export const getApplications = async (req, res) => {
//   try {
//     const applications = await Application.find();

//     res.status(200).json({
//       success: true,
//       applications
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// };
