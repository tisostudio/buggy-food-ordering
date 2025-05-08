import mongoose, { Schema, Document } from "mongoose";
import { hash, compare } from "bcrypt";


const EMAIL_REGEX = /\S+@\S+\.\S+/;

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  addresses: Array<{
    street: string;
    city: string;
    state: string;
    zipCode: string;
    isDefault: boolean;
  }>;
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      maxlength: [60, "Name cannot be more than 60 characters"],
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique:true,
      validate: {
        validator: (email: string) => EMAIL_REGEX.test(email),
        message: "Please provide a valid email",
      },
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [8, "Password must be at least 8 characters"],
      maxlength: [32, "Password must be at most 32 characters"]
    },
    addresses: [
      {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        
        zipCode: { type: String, required: true },
        isDefault: { type: Boolean, default: false },
      },
    ],
    phoneNumber: {
      type: String,
      match: [/^[1-9]\d{9}$/, "Please enter a valid 10-digit phone number"]
    },
  },
  {
    timestamps: true,
  }
);


UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    
    const saltRounds = process.env.NODE_ENV === "production" ? 5 : 10;
    this.password = await hash(this.password as string, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});


UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return compare(candidatePassword, this.password);
};



let UserModel: mongoose.Model<IUser>;

try {
  
  UserModel = mongoose.model<IUser>("User");
} catch {
  
  UserModel = mongoose.model<IUser>("User", UserSchema);
}

export default UserModel;
