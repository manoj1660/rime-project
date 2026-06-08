import mongoose from "mongoose";
const applicationSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: Number, required: true },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    gender: { type: String, required: true },
    address: { type: String },
    source: { 
      type: String, 
    
    },
    referenceName: { 
     type: String,
    },
    couponCode: { 
      type: String 
    },
  },
  { timestamps: true },
);

const applicationModel =
  mongoose.models.Application ||
  mongoose.model("Application", applicationSchema);

export default applicationModel;

