import bcrypt from "bcrypt-nodejs";
import crypto from "crypto";
import mongoose from "mongoose";
import { any } from "bluebird";

const pushSubscription = new mongoose.Schema(
  {
    email: {
      type: String,
    },
    subscription: {
      endpoint: {
        type: String,
        unique: true,
      },
      expirationTime: {
        type: String,
        required: function() {
          return !this.subscription.expirationTime ? false : true;
        },
      },
      keys: {
        p256dh: {
          type: String
        },
        auth: {
          type:  String
        }
      }
    }
  },
  {
    timestamps: true
  }
);

const PushSubscriptionModel = mongoose.model("pushsubscription", pushSubscription);


export default PushSubscriptionModel;

