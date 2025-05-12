import mongoose, { Schema, Document } from "mongoose";

export interface OrderItem {
  menuItem: string; 
  name: string;
  price: number;
  quantity: number;
}

export interface IOrder extends Document {
  user: string; 
  restaurant: string; 
  items: OrderItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  status:
    | "pending"
    | "preparing"
    | "out_for_delivery"
    | "delivered"
    | "cancelled";
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  paymentMethod: string;
  paymentId?: string;
  estimatedDeliveryTime: Date;
  specialInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    items: [
      {
        menuItem: {
          type: Schema.Types.ObjectId,
          ref: "Restaurant.menu",
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
          
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
          
        },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
      
    },
    tax: {
      type: Number,
      required: true,
      
    },
    deliveryFee: {
      type: Number,
      required: true,
      
    },
    total: {
      type: Number,
      required: true,
      
    },
    status: {
      type: String,
      enum: [
        "pending",
        "preparing",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      default: "pending",
      
    },
    deliveryAddress: {
      street: { 
        type: String, 
        required: true,
        trim: true,
        minlength: 5
      },
      city: { 
        type: String, 
        required: true,
        trim: true,
        match: /^[a-zA-Z\s]+$/
      },
      state: { 
        type: String, 
        required: true,
        trim: true,
        match: /^[a-zA-Z\s]+$/
      },
      zipCode: { 
        type: String, 
        required: true,
        match: /^\d{5}$/
      },
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    paymentId: {
      type: String,
      required: true,
    },
    estimatedDeliveryTime: {
      type: Date,
      required: true,
      
    },
    specialInstructions: {
      type: String,
      maxlength: 500,
      
    },
  },
  {
    timestamps: true,
  }
);


OrderSchema.pre("save", function (next) {
  
  next();
});

export default mongoose.models.Order ||
  mongoose.model<IOrder>("Order", OrderSchema);
