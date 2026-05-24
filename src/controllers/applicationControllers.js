import Application from "../models/applicationModel.js";
import mongoose from "mongoose";

// ✅ Create Application & Send to Google Sheets
export const createApplication = async (req, res) => {
  try {
    const { fullName, email, phone, course, gender, address } = req.body;

    // 🔴 Validation
    if (!fullName || !email || !phone || !course) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

    // 🔴 ObjectId check
    if (!mongoose.Types.ObjectId.isValid(course)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    // 🔴 Duplicate email check
    const existing = await Application.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Application already submitted with this email",
      });
    }

    // 1. Save to MongoDB
    const application = await Application.create({
      fullName,
      email,
      phone,
      course,
      gender,
      address,
    });

    // 2. Fetch the populated application to get Course Title for Google Sheets
    const populatedApp = await Application.findById(application._id).populate("course");

    // 3. 🔥 Forward to Google Sheets (Silent Background Request)
    // const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbw0U4QhCJm7-W1Jfsy2Kl-Z9NLtPN4MLZvE7jz1Gb6ANuG1SbRziK-dp4Ni9yvBNFY/exec";
    const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyEuGmN5urqYzxr8dTj_KXkZI5Oo_6l1ECSPpjdDaqHt5Djn7VgIWdAdC0rLJZI-ZWm/exec";

    fetch(GOOGLE_SHEET_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        email,
        phone,
        course: populatedApp.course ? populatedApp.course.title : "Unknown Course",
        gender,
        address,
        appliedAt: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      }),
    }).catch((err) => console.error("Google Sheet Error:", err));

    // 4. Send Immediate Success Response
    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: application,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
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
