import async from "async";
import crypto from "crypto";
import nodemailer from "nodemailer";
import passport from "passport";
import { default as User, UserModel, AuthToken } from "../models/User";
import PushSubscriptionModel from "../models/pushSubscription";
import { Request, Response, NextFunction } from "express";
import { IVerifyOptions } from "passport-local";
import { WriteError } from "mongodb";
import "../config/passport";
import webPush from "web-push";
const request = require("express-validator");


/**
 * GET /login
 * Login page.
 */
// export let getLogin = (req: Request, res: Response) => {
//   if (req.user) {
//     return res.redirect("/");
//   }
//   res.render("account/login", {
//     title: "Login"
//   });
// };
/**
 * Subscribe web push
 */
// {
//   email: {
//     type: String
//   },
//   subscription: {
//     endpoint: {
//       type: String
//     },
//     expirationTime: undefined,
//     keys: {
//       p256dh: {
//         type: String
//       },
//       auth: {
//         type:  String
//       }
//     }
//   }
// },
//

/**
 *
 * Web Push code start
 */

 export const subscribeWebPush = async (req: Request, res: Response, next: NextFunction) => {
  console.log("request", req.body);
  if (!req.body.email || !req.body.subscription) {
    return res.send({ status: "400", message: " Bad Request"});
  }
  const {
    email,
    subscription,
  } = req.body;
  const subscriptionModel = await PushSubscriptionModel.create({ email, subscription })
  .then(() => {
    return res.send({status: 200, message: "ok"});
  })
  .catch(() => {
    return res.send({status: ""});
  });
  return subscriptionModel;
  };

const sendPushNotification = ({ email, subscription }: {email: string, subscription: object}) => {
  console.log("push notification going to be sent ", email, subscription);
  const pushSubscription = subscription;
  // TODO 4.3a - include VAPID keys
  const vapidPublicKey =
    "BHsnkyoFLhhLWotMb9r9q8MS864VLz-90JEYgJY8ywEKj1L4B9Wjv4iN2Gg7nOGbl3UgwrHa2TAzFh83EpVnebQ"; //vapid change 4
  const vapidPrivateKey = "4Ya9U2eeKag1Y1iAfB1FHifqETvT_tyGJvAcT29MygI"; //vapid change 5
  const payload = "your message Hi!";
  const options = {
    //gcmAPIKey: 'AAAAM0IOs0Q:APA91bFVqnqSwtLWlsnrw_hyfPSL7ConhdD03Bkfjo7RJTMAYbclj2OcR2uSSTbRs3IAC-zHfeceqWfYYIJ6pGYhQztGtyYwlHAlUwf5YAzvHJRK_izawJuB5ewm4TRm5W4sC6WLarqU',  //gcmAPIKey: 'YOUR_SERVER_KEY', //vapid change 6
    TTL: 60,
    vapidDetails: {
      //vapid change 7 added vapid details
      subject: `mailto: ${email}`,
      publicKey: vapidPublicKey,
      privateKey: vapidPrivateKey
    }
    // TODO 4.3b - add VAPID details
  };
  webPush.sendNotification(pushSubscription, payload, options).then((push) => {
    console.log("push was sent successfully");
  })
  .catch(e => {
    console.log("not able to send the push", e);
  });
};

export const pushNotificationController = async (req: Request, res: Response, next: NextFunction) => {
  const results =  await PushSubscriptionModel.find({});
  if (results) {
    results.forEach((element) => {
      console.log("element in sendPushNotification controller", element);
      sendPushNotification({
        email: element.email,
        subscription: element.subscription,
      });
    });
  }
  res.send({status: "OK", message: "Notification Triggered"});
};
/**
 *
 * Web Push code end
 */

/**
 * POST /login
 * Sign in using email and password.
 */
export let postLogin = (req: Request, res: Response, next: NextFunction) => {
  req.assert("email", "Email is not valid").isEmail();
  req.assert("password", "Password cannot be blank").notEmpty();
  req.sanitize("email").normalizeEmail({ gmail_remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
    req.flash("errors", errors);
    return res.redirect("/login");
  }

  passport.authenticate("local", (err: Error, user: UserModel, info: IVerifyOptions) => {
    if (err) { return next(err); }
    if (!user) {
      req.flash("errors", info.message);
      return res.redirect("/login");
    }
    req.logIn(user, (err) => {
      if (err) { return next(err); }
      req.flash("success", { msg: "Success! You are logged in." });
      res.redirect(req.session.returnTo || "/");
    });
  })(req, res, next);
};

// /**
//  * GET /logout
//  * Log out.
//  */
// export let logout = (req: Request, res: Response) => {
//   req.logout();
//   res.redirect("/");
// };

// /**
//  * GET /signup
//  * Signup page.
//  */
// export let getSignup = (req: Request, res: Response) => {
//   if (req.user) {
//     return res.redirect("/");
//   }
//   res.render("account/signup", {
//     title: "Create Account"
//   });
// };

// /**
//  * POST /signup
//  * Create a new local account.
//  */
// export let postSignup = (req: Request, res: Response, next: NextFunction) => {
//   req.assert("email", "Email is not valid").isEmail();
//   req.assert("password", "Password must be at least 4 characters long").len({ min: 4 });
//   req.assert("confirmPassword", "Passwords do not match").equals(req.body.password);
//   req.sanitize("email").normalizeEmail({ gmail_remove_dots: false });

//   const errors = req.validationErrors();

//   if (errors) {
//     req.flash("errors", errors);
//     return res.redirect("/signup");
//   }

//   const user = new User({
//     email: req.body.email,
//     password: req.body.password
//   });

//   User.findOne({ email: req.body.email }, (err, existingUser) => {
//     if (err) { return next(err); }
//     if (existingUser) {
//       req.flash("errors", { msg: "Account with that email address already exists." });
//       return res.redirect("/signup");
//     }
//     user.save((err) => {
//       if (err) { return next(err); }
//       req.logIn(user, (err) => {
//         if (err) {
//           return next(err);
//         }
//         res.redirect("/");
//       });
//     });
//   });
// };

// /**
//  * GET /account
//  * Profile page.
//  */
// export let getAccount = (req: Request, res: Response) => {
//   res.render("account/profile", {
//     title: "Account Management"
//   });
// };

// /**
//  * POST /account/profile
//  * Update profile information.
//  */
// export let postUpdateProfile = (req: Request, res: Response, next: NextFunction) => {
//   req.assert("email", "Please enter a valid email address.").isEmail();
//   req.sanitize("email").normalizeEmail({ gmail_remove_dots: false });

//   const errors = req.validationErrors();

//   if (errors) {
//     req.flash("errors", errors);
//     return res.redirect("/account");
//   }

//   User.findById(req.user.id, (err, user: UserModel) => {
//     if (err) { return next(err); }
//     user.email = req.body.email || "";
//     user.profile.name = req.body.name || "";
//     user.profile.gender = req.body.gender || "";
//     user.profile.location = req.body.location || "";
//     user.profile.website = req.body.website || "";
//     user.save((err: WriteError) => {
//       if (err) {
//         if (err.code === 11000) {
//           req.flash("errors", { msg: "The email address you have entered is already associated with an account." });
//           return res.redirect("/account");
//         }
//         return next(err);
//       }
//       req.flash("success", { msg: "Profile information has been updated." });
//       res.redirect("/account");
//     });
//   });
// };

// /**
//  * POST /account/password
//  * Update current password.
//  */
// export let postUpdatePassword = (req: Request, res: Response, next: NextFunction) => {
//   req.assert("password", "Password must be at least 4 characters long").len({ min: 4 });
//   req.assert("confirmPassword", "Passwords do not match").equals(req.body.password);

//   const errors = req.validationErrors();

//   if (errors) {
//     req.flash("errors", errors);
//     return res.redirect("/account");
//   }

//   User.findById(req.user.id, (err, user: UserModel) => {
//     if (err) { return next(err); }
//     user.password = req.body.password;
//     user.save((err: WriteError) => {
//       if (err) { return next(err); }
//       req.flash("success", { msg: "Password has been changed." });
//       res.redirect("/account");
//     });
//   });
// };

// /**
//  * POST /account/delete
//  * Delete user account.
//  */
// export let postDeleteAccount = (req: Request, res: Response, next: NextFunction) => {
//   User.remove({ _id: req.user.id }, (err) => {
//     if (err) { return next(err); }
//     req.logout();
//     req.flash("info", { msg: "Your account has been deleted." });
//     res.redirect("/");
//   });
// };

// /**
//  * GET /account/unlink/:provider
//  * Unlink OAuth provider.
//  */
// export let getOauthUnlink = (req: Request, res: Response, next: NextFunction) => {
//   const provider = req.params.provider;
//   User.findById(req.user.id, (err, user: any) => {
//     if (err) { return next(err); }
//     user[provider] = undefined;
//     user.tokens = user.tokens.filter((token: AuthToken) => token.kind !== provider);
//     user.save((err: WriteError) => {
//       if (err) { return next(err); }
//       req.flash("info", { msg: `${provider} account has been unlinked.` });
//       res.redirect("/account");
//     });
//   });
// };

// /**
//  * GET /reset/:token
//  * Reset Password page.
//  */
// export let getReset = (req: Request, res: Response, next: NextFunction) => {
//   if (req.isAuthenticated()) {
//     return res.redirect("/");
//   }
//   User
//     .findOne({ passwordResetToken: req.params.token })
//     .where("passwordResetExpires").gt(Date.now())
//     .exec((err, user) => {
//       if (err) { return next(err); }
//       if (!user) {
//         req.flash("errors", { msg: "Password reset token is invalid or has expired." });
//         return res.redirect("/forgot");
//       }
//       res.render("account/reset", {
//         title: "Password Reset"
//       });
//     });
// };

// /**
//  * POST /reset/:token
//  * Process the reset password request.
//  */
// export let postReset = (req: Request, res: Response, next: NextFunction) => {
//   req.assert("password", "Password must be at least 4 characters long.").len({ min: 4 });
//   req.assert("confirm", "Passwords must match.").equals(req.body.password);

//   const errors = req.validationErrors();

//   if (errors) {
//     req.flash("errors", errors);
//     return res.redirect("back");
//   }

//   async.waterfall([
//     function resetPassword(done: Function) {
//       User
//         .findOne({ passwordResetToken: req.params.token })
//         .where("passwordResetExpires").gt(Date.now())
//         .exec((err, user: any) => {
//           if (err) { return next(err); }
//           if (!user) {
//             req.flash("errors", { msg: "Password reset token is invalid or has expired." });
//             return res.redirect("back");
//           }
//           user.password = req.body.password;
//           user.passwordResetToken = undefined;
//           user.passwordResetExpires = undefined;
//           user.save((err: WriteError) => {
//             if (err) { return next(err); }
//             req.logIn(user, (err) => {
//               done(err, user);
//             });
//           });
//         });
//     },
//     function sendResetPasswordEmail(user: UserModel, done: Function) {
//       const transporter = nodemailer.createTransport({
//         service: "SendGrid",
//         auth: {
//           user: process.env.SENDGRID_USER,
//           pass: process.env.SENDGRID_PASSWORD
//         }
//       });
//       const mailOptions = {
//         to: user.email,
//         from: "express-ts@starter.com",
//         subject: "Your password has been changed",
//         text: `Hello,\n\nThis is a confirmation that the password for your account ${user.email} has just been changed.\n`
//       };
//       transporter.sendMail(mailOptions, (err) => {
//         req.flash("success", { msg: "Success! Your password has been changed." });
//         done(err);
//       });
//     }
//   ], (err) => {
//     if (err) { return next(err); }
//     res.redirect("/");
//   });
// };

// /**
//  * GET /forgot
//  * Forgot Password page.
//  */
// export let getForgot = (req: Request, res: Response) => {
//   if (req.isAuthenticated()) {
//     return res.redirect("/");
//   }
//   res.render("account/forgot", {
//     title: "Forgot Password"
//   });
// };

// /**
//  * POST /forgot
//  * Create a random token, then the send user an email with a reset link.
//  */
// export let postForgot = (req: Request, res: Response, next: NextFunction) => {
//   req.assert("email", "Please enter a valid email address.").isEmail();
//   req.sanitize("email").normalizeEmail({ gmail_remove_dots: false });

//   const errors = req.validationErrors();

//   if (errors) {
//     req.flash("errors", errors);
//     return res.redirect("/forgot");
//   }

//   async.waterfall([
//     function createRandomToken(done: Function) {
//       crypto.randomBytes(16, (err, buf) => {
//         const token = buf.toString("hex");
//         done(err, token);
//       });
//     },
//     function setRandomToken(token: AuthToken, done: Function) {
//       User.findOne({ email: req.body.email }, (err, user: any) => {
//         if (err) { return done(err); }
//         if (!user) {
//           req.flash("errors", { msg: "Account with that email address does not exist." });
//           return res.redirect("/forgot");
//         }
//         user.passwordResetToken = token;
//         user.passwordResetExpires = Date.now() + 3600000; // 1 hour
//         user.save((err: WriteError) => {
//           done(err, token, user);
//         });
//       });
//     },
//     function sendForgotPasswordEmail(token: AuthToken, user: UserModel, done: Function) {
//       const transporter = nodemailer.createTransport({
//         service: "SendGrid",
//         auth: {
//           user: process.env.SENDGRID_USER,
//           pass: process.env.SENDGRID_PASSWORD
//         }
//       });
//       const mailOptions = {
//         to: user.email,
//         from: "hackathon@starter.com",
//         subject: "Reset your password on Hackathon Starter",
//         text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
//           Please click on the following link, or paste this into your browser to complete the process:\n\n
//           http://${req.headers.host}/reset/${token}\n\n
//           If you did not request this, please ignore this email and your password will remain unchanged.\n`
//       };
//       transporter.sendMail(mailOptions, (err) => {
//         req.flash("info", { msg: `An e-mail has been sent to ${user.email} with further instructions.` });
//         done(err);
//       });
//     }
//   ], (err) => {
//     if (err) { return next(err); }
//     res.redirect("/forgot");
//   });
// };
