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


OrderSchema.pre("save", async function (next) {
  try {
    //fixing the code for issue 24. I didn't notice that resturant had an delivery time field. 
    const restaurant = await mongoose.models.Restaurant.findById(this.restaurant);

    if (!restaurant) {
      return next(new Error("Restaurant not found"));
    }

    const baseTimeMinutes = restaurant.deliveryTime; 

    const peakHoursMultiplier = 1.5;
    
    const currentHour = new Date().getHours();
    const isPeakHour = (currentHour >= 11 && currentHour <= 14) || (currentHour >= 17 && currentHour <= 20); // Assuming peak hour is 11AM-02PM & Evening 5PM to 8PM
    
    const activeOrders = await mongoose.models.Order.countDocuments({
      restaurant: this.restaurant,
      status: { $in: ["pending", "preparing"] },
    });

    let estimatedMinutes = baseTimeMinutes + activeOrders * 2; // Add time based on active orders

    // Increase time during peak hours
    if (isPeakHour) {
      estimatedMinutes *= peakHoursMultiplier;
    }

    this.estimatedDeliveryTime = new Date(Date.now() + estimatedMinutes * 60000); // Convert to Date object

    next();
  } catch (err) {
    next(err as Error);
  }
});

export default mongoose.models.Order ||
  mongoose.model<IOrder>("Order", OrderSchema);
