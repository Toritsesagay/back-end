const mongoose = require("mongoose");
const jwt = require("jsonwebtoken")
const { generateAcessToken, OneTimePasswordTemplate } = require('../utils/utils')
const { User, Token, RecoverToken, PhoneToken, Card, History, Beneficiaries, Notification,Account } = require("../database/databaseConfig");
const random_number = require("random-number")
const NanoId = require('nano-id');
const moment = require('moment')

const Mailjet = require('node-mailjet')
let request = require('request');

const { verifyTransactionToken, verifyEmailTemplate, passwordResetTemplate, TransferRequestTemplate,DebitRequestTemplate,DepositRequestTemplate } = require('../utils/utils')

module.exports.getUserFromJwt = async (req, res, next) => {
   try {
      let token = req.headers["header"]

      if (!token) {
         throw new Error("a token is needed ")
      }
      const decodedToken = jwt.verify(token, process.env.SECRET_KEY)
      const user = await User.findOne({ email: decodedToken.email })

      if (!user) {
         //if user does not exist return 404 response
         return res.status(404).json({
            response: "user has been deleted"
         })
      }

      return res.status(200).json({
         response: {
            user: user,
         }
      })

   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)
   }

}


module.exports.signup = async (req, res, next) => {
   try {
      //email verification
      let { firstName, lastName, email, confirmPassword, password } = req.body
      //check if the email already exist
      let userExist = await User.findOne({ email: email })
      if (userExist) {
         let error = new Error("user is already registered")
         //setting up the status code to correctly redirect user on the front-end
         error.statusCode = 301
         return next(error)
      }


      if (password !== confirmPassword) {
         let error = new Error("confirm password does not match")
         //setting up the status code to correctly redirect user on the front-end
         return next(error)
      }

      //email API gets call 
      let accessToken = generateAcessToken(email)


      if (!accessToken) {
         let error = new Error("acess token error")
         return next(error)
      }

      
      //returning front-end code to seperately verify email
      let verifyUrl = `www.digitamon.com/verification/${accessToken}`

      // Create mailjet send emal
      const mailjet = Mailjet.apiConnect(process.env.MAILJET_APIKEY, process.env.MAILJET_SECRETKEY
      )

      const request = await mailjet.post("send", { 'version': 'v3.1' })
         .request({
            "Messages": [
               {
                  "From": {
                     "Email": "digitamon@digitamon.com",
                     "Name": "digitamon"
                  },
                  "To": [
                     {
                        "Email": `${email}`,
                        "Name": `${firstName}`
                     }
                  ],
                  "Subject": "Account Verification",
                  "TextPart": `Dear ${email}, welcome! please click the link  ${verifyUrl}  to verify your email!`,
                  "HTMLPart": verifyEmailTemplate(verifyUrl, email)
               }
            ]
         })

      if (!request) {
         let error = new Error("please use a valid email")
         return next(error)
      }

      //hence proceed to create models of user and token
      let newToken = new Token({
         _id: new mongoose.Types.ObjectId(),
         email: email,
         token: accessToken
      })

      let savedToken = await newToken.save()

      if (!savedToken) {
         //cannot save user
         let error = new Error("an error occured on the server")
         return next(error)
      }

      //automatically generating every useful code
      let taxCode = random_number({
         min: 1000,
         max: 3000,
         integer: true
      })


      let bsaCode = random_number({
         min: 3000,
         max: 6000,
         integer: true
      })

      let oneTimePassword = random_number({
         min: 6000,
         max: 9000,
         integer: true
      })

      //hence proceed to create models of user and token
      let newUser = new User({
         _id: new mongoose.Types.ObjectId(),
         firstName: firstName,
         lastName: lastName,
         email: email,
         password: password,
         taxCode: taxCode,
         bsaCode: bsaCode,
         oneTimePassword: oneTimePassword,
         accountVerified: false
      })




      let savedUser = await newUser.save()
      if (!savedUser) {
         //cannot save user
         let error = new Error("user could not be saved")
         return next(error)
      }


      //create acess token to send to front-end
      let token = generateAcessToken(savedUser.email)

      return res.status(200).json({
         response: 'verified. go back',
         user: savedUser,
         userToken: token,
         userExpiresIn: '500',
      })
   } catch (error) {
      console.log(error)
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}
//sign in user with different response pattern
module.exports.login = async (req, res, next) => {
   try {
      let { email, password } = req.body

      let userExist = await User.findOne({ email: email })

      if (!userExist) {
         return res.status(404).json({
            response: "user is not yet registered"
         })
      }

      //check if password corresponds
      if (userExist.password != password) {
         let error = new Error("Password does not match")
         return next(error)
      }

      //check if info is not verified
      if (!userExist.infoVerified) {
         let token = generateAcessToken(email)

         return res.status(202).json({
            response: {
               user: userExist,
               userToken: token,
               userExpiresIn: '500',
               message: 'please complete your registeration'
            }
         })
      }

      if (!userExist.photoVerified) {

         let token = generateAcessToken(email)

         return res.status(203).json({
            response: {
               user: userExist,
               userToken: token,
               userExpiresIn: '500',
               message: 'please upload a photo of yourself'
            }
         })
      }


      //at this point,return jwt token and expiry alongside the user credentials
      let token = generateAcessToken(email)
      //fetch all account 

      let accounts = await Account.find({user:userExist})


      return res.status(206).json({
         response: {
            user: userExist,
            userToken: token,
            userExpiresIn: '500',
            message: 'Login sucess',
            accounts:accounts
         }
      })

   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)

   }
}
//screen that continously polls the server
module.exports.verifyEmail = async (req, res, next) => {
   try {
      let email = req.params.email
      let userExist = await User.findOne({ email: email })

      if (!userExist) {
         return res.status(404).json({
            response: "user is not yet registered"
         })
      }

      if (!userExist.emailVerified) {
         return res.status(301).json({
            response: "could not verify"
         })
      }

      //create acess token to send to front-end
      let token = await generateAcessToken(email)

      return res.status(200).json({
         response: "successfully verified",
         user: userExist,
         userToken: token,
         userExpiresIn: '500',
      })



   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}
//route that verifies the email
module.exports.checkverification = async (req, res, next) => {
   try {
      let token = req.params.token
      let email = await verifyTransactionToken(token)
      //find the token model
      

      let tokenExist = await Token.findOne({ email: email })

      if (!tokenExist) {
         let error = new Error("token does not exist or may have expired")
         return next(error)
      }

      //modify the user credential
      let user = await User.findOne({ email: email })
      if (!user) {
         return res.status(404).json({
            response: 'user does not exist'
         })
      }

      user.emailVerified = true
      let savedUser = await user.save()
      if (!savedUser) {
         let error = new Error("an error occured on the server")
         return next(error)
      }
      //delete the token model
      await Token.deleteOne({ email: email })

      //create acess token to send to front-end
      let newToken = generateAcessToken(email)

      return res.status(200).json({
         response: 'verified. go back',
         user: savedUser,
         userToken: newToken,
         userExpiresIn: '500',
      })

   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)
   }


}
//sending recovery email to user
module.exports.sendRecoverEmail = async (req, res, next) => {
   try {
      //email verification
      let { email } = req.body
      //check if the email already exist
      let userExist = await User.findOne({ email: email })
      if (!userExist) {
         let error = new Error("theres no account with this email")
         //setting up the status code to correctly redirect user on the front-end
         error.statusCode = 301
         return next(error)
      }

      //email API gets call 
      let accessToken = generateAcessToken(email)
      if (!accessToken) {
         let error = new Error("acess token error")
         return next(error)
      }

      //returning front-end code to seperately verify email

      let verifyUrl = `https://mobile-frontend.onrender.com/resetpassword/${accessToken}`


      // Create mailjet send email
      const mailjet = Mailjet.apiConnect(process.env.MAILJET_APIKEY, process.env.MAILJET_SECRETKEY
      )

      const request = await mailjet.post("send", { 'version': 'v3.1' })
         .request({
            "Messages": [
               {
                  "From": {
                     "Email": "digitamon@digitamon.com",
                     "Name": "digitamon"
                  },
                  "To": [
                     {
                        "Email": `${email}`,
                        "Name": `${email}`
                     }
                  ],

                  "Subject": "Account Verification",
                  "TextPart": `Dear ${email}, welcome to digitamon! please click the link  ${verifyUrl}  to verify your email!`,
                  "HTMLPart": passwordResetTemplate(verifyUrl, email)

               }
            ]
         })
      //160.119.252.183

      if (!request) {
         let error = new Error("please use a valid email")
         return next(error)

      }

      //hence proceed to create models of user and token


      let newToken = new RecoverToken({
         _id: new mongoose.Types.ObjectId(),
         email: email,
         token: accessToken
      })

      let savedToken = await newToken.save()

      if (!savedToken) {
         //cannot save user
         let error = new Error("an error occured on the server")
         return next(error)
      }

      return res.status(200).json({
         response: 'user has been saved'
      })

   } catch (error) {
      console.log(error)
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}

module.exports.checkrecovertokenvalidity = async (req, res, next) => {
   try {
      //email verification
      let token = req.params.token
      //check if the token is still valid
      let tokenExist = await RecoverToken.findOne({
         token: token
      })

      if (!tokenExist) {
         let error = new Error("token does not exist or may have expired")
         //setting up the status code to correctly redirect user on the front-end
         return next(error)
      }
      return res.status(200).json({
         response: 'Enter a new password for your account'
      })

   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}

module.exports.changepassword = async (req, res, next) => {
   try {
      //email verification
      let { password, confirmPassword } = req.body
      let token = req.params.token

      //check if the token is still valid
      let tokenExist = await RecoverToken.findOne({ token: token })


      if (!tokenExist) {
         let error = new Error("token does not exist or may have expired")
         //setting up the status code to correctly redirect user on the front-end
         return next(error)
      }

      if (password !== confirmPassword) {
         let error = new Error("password does not match")
         //setting up the status code to correctly redirect user on the front-end
         return next(error)
      }

      let email = await verifyTransactionToken(token)

      let userExist = await User.findOne({ email: email })

      if (!userExist) {
         let error = new Error("email account may has been deleted")
         //setting up the status code to correctly redirect user on the front-end
         return next(error)

      }

      userExist.password = password

      let saveUser = await userExist.save()

      if (!saveUser) {
         let error = new Error("an error occured on the server")
         //setting up the status code to correctly redirect user on the front-end
         return next(error)

      }
      return res.status(200).json({
         response: 'Password changed sucessfully'
      })


   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}
module.exports.phonesignup = async (req, res, next) => {
   try {
      //email verification
      let { countryCode, phoneNumber } = req.body
      let phone = `${countryCode}${phoneNumber}`

      // checking if a user exist with the phone number
      let phoneExist = await User.findOne({ phoneNumber: phone })

      //fetching user email
      let token = req.params.token

      let email = await verifyTransactionToken(token)

      /*if (phoneExist) {
         let error = new Error("Phone number is already registered")
         return next(error)
      }*/
      


      let userExist = await User.findOne({ email: email })
      if (!userExist) {
         let error = new Error("user does not exist")
         return next(error)
      }

      userExist.phoneNumber = phone

      let modifiedUser = await userExist.save()


      if (!modifiedUser) {
         let error = new Error("Phone number is already registered")
         return next(error)
      }

      //Api send code  to the phone for verification
      //create a phone random token
      let accessToken = random_number({
         max: 5000,
         min: 4000,
         integer: true
      })
      //start sending sms

      /*let data = {
         "to": phone,
         "from": "Coincap",
         "sms": `${accessToken} is your verification code.Do not share this code with anyone`,
         "type": "plain",
         "api_key": process.env.TERMII_API_KEY,
         "channel": "generic",
      };

      var options = {
         'method': 'POST',
         'url': 'https://api.ng.termii.com/api/sms/send',
         'headers': {
            'Content-Type': ['application/json', 'application/json']
         },
         body: JSON.stringify(data)
      };
      request(options, function (error, response) {
         if (error) {
            console.log(error)
         }
         console.log(response);
      });
      */

      let sentMessage = false
      //if sms api does not work, verifying with email
      if (!sentMessage) {
         //send email instead
         // Create mailjet send email
         const mailjet = Mailjet.apiConnect(process.env.MAILJET_APIKEY, process.env.MAILJET_SECRETKEY
         )

         const request = await mailjet.post("send", { 'version': 'v3.1' })
            .request({
               "Messages": [
                  {
                     "From": {
                        "Email": "digitamon@digitamon.com",
                        "Name": "digitamon"
                     },
                     "To": [
                        {
                           "Email": `${userExist.email}`,
                           "Name": `${userExist.firstName}`
                        }
                     ],
                     "Subject": "Account Verification",
                     "TextPart": `digitamon verificatioon code is ${accessToken}
                             `,
                     "HTMLPart": `<div>
                             <p>
                             digitamon verificatioon code is ${accessToken}
                             </p>
                             
                             </div>`
                  }
               ]
            })


         if (!request) {
            let error = new Error("could not verify.Try later")
            return next(error)
         }



      }
      //save phoneToken temporarily to database



      let newToken = new PhoneToken({
         _id: new mongoose.Types.ObjectId(),
         email: email,
         token: accessToken
      })

      let saveToken = await newToken.save()

      if (!saveToken) {
         let error = new Error("could not save token")
         return next(error)
      }

      return res.status(200).json({
         response: 'An sms with a 4 digit code has been sent to verify your phone number.'
      })

   } catch (error) {
      console.log(error)
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}

module.exports.verifyphone = async (req, res, next) => {
   try {
      let token = req.params.token
      let email = await verifyTransactionToken(token)
      let { code } = req.body

      let userExist = await User.findOne({ email: email })



      if (!userExist) {
         let error = new Error("user does not exist")
         return next(error)
      }

      //find token 
      let tokenExist = await PhoneToken.findOne({ token: code })

      if (!tokenExist) {
         let error = new Error("token does not exist or may have expired")
         return next(error)
      }

      //verify phone

      userExist.numberVerified = true

      let saveUser = await userExist.save()

      if (!saveUser) {
         let error = new Error("an error occured on the server")
         //setting up the status code to correctly redirect user on the front-end
         return next(error)
      }


      return res.status(200).json({
         response: 'Phone verified sucessfully'
      })


   } catch (error) {
      console.log(error)
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}

module.exports.registeration = async (req, res, next) => {
   try {
      //let token = req.params.token
      let token = req.params.token
      let email = await verifyTransactionToken(token)

      let { Nid, country, state, address, passportUrl } = req.body

      if (!passportUrl) {
         let error = new Error("passport photo needed")
         return next(error)
      }

      let userExist = await User.findOne({ email: email })
      if (!userExist) {
         let error = new Error("user does not exist")
         return next(error)
      }

      userExist.nid = Nid
      userExist.country = country
      userExist.state = state
      userExist.address = address
      userExist.passportUrl = passportUrl
      userExist.infoVerified = true


      let savedUser = await userExist.save()

      if (!savedUser) {
         let error = new Error("an error occured")
         return next(error)
      }

      return res.status(200).json({
         response: 'registered successfully'
      })


   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}

module.exports.profilephoto = async (req, res, next) => {
   try {
      //let token = req.params.token
      let token = req.params.token
      let email = await verifyTransactionToken(token)

      let { profilePhotoUrl } = req.body

      if (!profilePhotoUrl) {
         let error = new Error("profile photo needed")
         return next(error)
      }

      let userExist = await User.findOne({ email: email })
      if (!userExist) {
         let error = new Error("user does not exist")
         return next(error)
      }

      userExist.profilePhotoUrl = profilePhotoUrl
      userExist.photoVerified = true


      let savedUser = await userExist.save()

      if (!savedUser) {
         let error = new Error("an error occured")
         return next(error)
      }

      return res.status(200).json({
         response: 'registered successfully'
      })

   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}

module.exports.hasCard = async (req, res, next) => {
   try {
      //let token = req.params.token
      let token = req.params.token
      let email = await verifyTransactionToken(token)

      let userExist = await User.findOne({
         email: email
      })

      if (!userExist) {
         let error = new Error("user does not exist")
         return next(error)
      }

      let cardExist = await Card.findOne({
         user: userExist
      })

      if (!cardExist) {
         let error = new Error("card does not exist")
         return next(error)
      }

      return res.status(200).json({
         response: cardExist
      })

   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}

module.exports.createCard = async (req, res, next) => {
   try {
      let token = req.params.token
      let email = await verifyTransactionToken(token)
      let { nameOnCard, cardType } = req.body

      let userExist = await User.findOne({ email: email })

      if (!userExist) {
         let error = new Error("user does not exist")
         return next(error)
      }

      if (!userExist.accountVerified) {
         let error = new Error("Account has not been approved for transaction at the moment. please contact admin")
         return next(error)

      }

      if (userExist.card) {
         let error = new Error("A card exist for this account")
         return next(error)
      }

      let currentDate = new Date();
      let fourYearDate = new Date(currentDate.getFullYear() + 4, currentDate.getMonth(), currentDate.getDate());
      let getFourYear = `${fourYearDate.getFullYear()}-${fourYearDate.getMonth()}-${fourYearDate.getDay()}`

      let cvv = random_number({
         max: 900,
         min: 100,
         integer: true
      })

      let cardNumber = random_number({
         max: 9000000000000000,
         min: 1000000000000000,
         integer: true
      })

      let newCard = new Card({
         _id: new mongoose.Types.ObjectId(),
         nameOnCard: nameOnCard,
         cardNumber: cardNumber,
         cvv: cvv,
         expiry: getFourYear,
         user: userExist,
      })

      let saveCard = await newCard.save()

      if (!saveCard) {
         let error = new Error("n error occured on the server")
         return next(error)
      }

      let user = await User.findOne({ email: userExist.email })
      if (!user) {
         let error = new Error("an error occured on the server")
         return next(error)
      }

      //saving user
      user.card = saveCard
      let saveUser = await user.save()

      if (!saveUser) {
         let error = new Error("n error occured on the server")
         return next(error)
      }


      return res.status(200).json({
         response: {
            user: saveUser,
            card: saveCard
         }
      })


   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}

module.exports.deleteCard = async (req, res, next) => {
   try {
      let token = req.params.token
      let email = await verifyTransactionToken(token)


      let userExist = await User.findOne({ email: email })

      if (!userExist) {
         let error = new Error("user does not exist")
         return next(error)
      }

      //deleting card
      let deleteCard = await Card.deleteMany({ user: userExist })

      if (!deleteCard) {
         let error = new Error("an error occured")
         return next(error)
      }

      let user = await User.findOne({ email: email })
      if (!user) {
         let error = new Error("user does not exist")
         return next(error)
      }

      user.card = null
      let savedUser = await user.save()

      return res.status(200).json({
         response: {
            user: savedUser
         }
      })
   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}

module.exports.tax = async (req, res, next) => {
   try {
      let token = req.params.token
      let email = await verifyTransactionToken(token)

      let { taxCode } = req.body

      let userExist = await User.findOne({ email: email })

      if (!userExist) {
         let error = new Error("user does not exist")
         return next(error)
      }



      if (userExist.taxCode !== taxCode) {
         let error = new Error("tax code not match,contact admin")
         return next(error)
      }

      userExist.taxVerified = true
      let savedUser = await userExist.save()

      if (!savedUser) {
         let error = new Error("an error occured")
         return next(error)
      }

      return res.status(200).json({
         response: {
            user: savedUser
         }
      })
   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}
module.exports.bsa = async (req, res, next) => {
   try {
      let token = req.params.token
      let email = await verifyTransactionToken(token)
      let { bsaCode } = req.body


      let userExist = await User.findOne({ email: email })

      if (!userExist) {
         let error = new Error("user does not exist")
         return next(error)
      }



      if (userExist.bsaCode !== bsaCode) {
         let error = new Error("bsa code does not match. please contact admin")
         return next(error)
      }

      userExist.bsaVerified = true
      let savedUser = await userExist.save()

      if (!savedUser) {
         let error = new Error("an error occured")
         return next(error)
      }

      return res.status(200).json({
         response: {
            user: savedUser
         }
      })
   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}

/*
User.deleteMany().then(data => {
   console.log(data)
})
History.find().then(data => {
   console.log(data)
})
Beneficiaries.deleteMany().then(data => {
   console.log(data)
})
Transfer.deleteMany().then(data => {
   console.log(data)
})
Token.deleteMany().then(data => {
   console.log(data)
})
 RecoverToken.deleteMany().then(data => {
   console.log(data)
})
  PhoneToken.deleteMany().then(data => {
   console.log(data)
})
  Card.deleteMany().then(data => {
   console.log(data)
})
  Deposit.deleteMany().then(data => {
   console.log(data)
}) 
  Withdraw.deleteMany().then(data => {
   console.log(data)
}) 
 Notification.deleteMany().then(data => {
   console.log(data)
})
*/

module.exports.createDeposit = async (req, res, next) => {
   try {
      let token = req.params.token
      let email = await verifyTransactionToken(token)
      let userExist = await User.findOne({ email: email })
     

      if (!userExist) {
         let error = new Error("user does not exist")
         return next(error)
      }
      if (!userExist.accountVerified) {
         let error = new Error("account has not been verified. kindly contact admin")
         return next(error)
      }
   
      let {
         amount,
         reason,
         sourceAccount: {
            Balance,
            _id,
            accountNumber:sourceAccountNumber,
            accountType,
            user,
          }
      } = req.body
      const id = NanoId(10);

      let currentDate = new Date();

      let fourYearDate = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getUTCDate()}`

      //create  a deposit instance of schema
      let newHistory = new History({
         _id: new mongoose.Types.ObjectId(),
         id: id,
         date: fourYearDate,
         amount: amount,
         transactionType: 'Deposit',
         reason: reason,
         user: userExist,
         sourceAccountNumber
      })

      let saveHistory = await newHistory.save()

      if (!saveHistory) {
         let error = new Error("an error occured")
         return next(error)
      }

      // send deposit email
      // Create mailjet send email
      const mailjet = Mailjet.apiConnect(process.env.MAILJET_APIKEY, process.env.MAILJET_SECRETKEY
         )
         const request = await mailjet.post("send", { 'version': 'v3.1' })
            .request({
               "Messages": [
                  {
                     "From": {
                     "Email": "digitamon@digitamon.com",
                     "Name": "digitamon"
                  },
                     "To": [
                        {
                           "Email": `${userExist.email}`,
                           "Name": `${userExist.firstName}`
                        }
                     ],
                     "Subject": "CREDIT REQUEST",
                     "TextPart": `Your deposit request of $${amount} was recieved and awaiting approval. Contact admin to make the actual payment`,
                     "HTMLPart": DepositRequestTemplate(amount),
                  }
               ]
            })

         if (!request) {
            let error = new Error("an error occurred")
            return next(error)
         }


         /*//start sending sms
         let data = {
            "to": userExist.phoneNumber,
            "from": "Coincap",
            "sms": `You have been debited for the sum of $${amount} from your  account ${userExist.accountNumber} on ${fourYearDate}`,
            "type": "plain",
            "api_key": process.env.TERMII_API_KEY,
            "channel": "generic",
         };
         var options = {
            'method': 'POST',
            'url': 'https://api.ng.termii.com/api/sms/send',
            'headers': {
               'Content-Type': ['application/json', 'application/json']
            },
            body: JSON.stringify(data)
         };
         request(options, function (error, response) {
            if (error) {
               console.log(error)
            }
            console.log(response);
         });
         */

      //retrieve  all deposit of this specific user
      let foundHistory = await History.find({ user: userExist })

      if (!foundHistory) {
         let error = new Error("an error occured")
         return next(error)
      }

      return res.status(200).json({
         response: foundHistory
      })

   } catch (error) {
      console.log(error)
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}
module.exports.createWithdraw = async (req, res, next) => {
   try {
      let token = req.params.token
      let email = await verifyTransactionToken(token)
    
     
   
      let {
         amount,
         country,
         nameOfBank,
         accountName,
         accountNumber,
         stateName,
         bankAddress,
         routeNumber,
         reason,
         sourceAccount: {
            Balance,
            _id,
            accountNumber:sourceAccountNumber,
            accountType,
            user,
          }

      } = req.body



      let userExist = await User.findOne({ email: email })


      if (!userExist) {
         let error = new Error("user does not exist")
         return next(error)
      }

      if (!userExist.accountVerified) {
         let error = new Error("account has not been verified. kindly contact admin")
         return next(error)

      }

      //check for tax code
      if (!userExist.taxVerified) {
         return res.status(301).json({
            response: 'tax code not found'
         })
      }


      if (!userExist.bsaVerified) {
         return res.status(302).json({
            response: 'BSA code not found'
         })
      }

      //finding the account
      let account = await Account.find({user:userExist})

      let currentAccount = account.find(data=>data.accountNumber === sourceAccountNumber )





      //check for balance
      if (currentAccount.Balance < amount) {
         let error = new Error("Insufficient funds")
         return next(error)
      }

      currentAccount.Balance = currentAccount.Balance - amount

      await currentAccount.save()

      //if all codes has been verified

      let currentDate = new Date();
      let fourYearDate = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getUTCDate()}`

      const id = NanoId(10);

      let newHistory = new History({
         _id: new mongoose.Types.ObjectId(),
         id: id,
         amount,
         country,
         nameOfCountry:nameOfBank,
         accountName,
         accountNumber,
         stateName,
         bankAddress,
         routeNumber,
         date: fourYearDate,
         transactionType:'withdraw',
         reason,
         user: userExist,
         sourceAccountNumber
      })

      let savedHistory = newHistory.save()

      if (!savedHistory) {
         let error = new Error("an error occured")
         return next(error)
      }

      //send withdraw email


      // Create mailjet send email
      const mailjet = Mailjet.apiConnect(process.env.MAILJET_APIKEY, process.env.MAILJET_SECRETKEY
      )
      const request = await mailjet.post("send", { 'version': 'v3.1' })
         .request({
            "Messages": [
               {
                  "From": {
                     "Email": "digitamon@digitamon.com",
                     "Name": "digitamon"
                  },
                  "To": [
                     {
                        "Email": `${userExist.email}`,
                        "Name": `${userExist.firstName}`
                     }
                  ],

                  "Subject": "DEBIT ALERT",
                  "TextPart": `Your request to withdraw $${amount} has been recieved and would be approve.contact admin if any delay arises`,
                  "HTMLPart": DebitRequestTemplate(amount),
               }


            ]
         })
      if (!request) {
         let error = new Error("an error occurred")
         return next(error)
      }
      /*//start sending sms
      let data = {
         "to": userExist.phoneNumber,
         "from": "Coincap",
         "sms": `You have been debited for the sum of $${amount} from your  account ${userExist.accountNumber} on ${fourYearDate}`,
         "type": "plain",
         "api_key": process.env.TERMII_API_KEY,
         "channel": "generic",
      };
      var options = {
         'method': 'POST',
         'url': 'https://api.ng.termii.com/api/sms/send',
         'headers': {
            'Content-Type': ['application/json', 'application/json']
         },
         body: JSON.stringify(data)
      };
      request(options, function (error, response) {
         if (error) {
            console.log(error)
         }
         console.log(response);
      });
      */
      //fetch and retrieve all account 

      let allAccount = await Account.find({user:userExist})



      return res.status(200).json({
         response: {
            savedHistory,
            allAccount,
         }
      })

   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}
//transfer to bank account
module.exports.sendAccount = async (req, res, next) => {
   try {
      let token = req.params.token
      let email = await verifyTransactionToken(token)
      //algorithm
   
      let {
         amount,
         accountNumber,
         routeNumber,
         message,
         accountName,
         nameOfBank,
         nameOfCountry,
         addToFavorite,
         sourceAccount: {
            Balance,
            _id,
            accountNumber:sourceAccountNumber,
            accountType,
            user,
          }
      } = req.body

      let userExist = await User.findOne({ email: email })
      //check for account verification
      if (!userExist.accountVerified) {
         let error = new Error("account has not been verified. kindly contact admin")
         return next(error)
      }

      //check for balance
      if (userExist.walletBalance < amount) {
         let error = new Error("Insufficient funds")
         return next(error)
      }
      //check for tax code
      if (!userExist.taxVerified) {
         return res.status(301).json({
            response: 'tax code not found'
         })
      }

      if (!userExist.bsaVerified) {
         return res.status(302).json({
            response: 'BSA code not found'
         })
      }


      //finding the account
      let account = await Account.find({user:userExist})

      let currentAccount = account.find(data=>data.accountNumber === sourceAccountNumber )


      currentAccount.Balance = Number(currentAccount.Balance) - Number(amount)

      await currentAccount.save()

     
      const id = NanoId(10);

      let currentDate = new Date();
      let fourYearDate = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getUTCDate()}`


      let newTransfer = new History({
         _id: new mongoose.Types.ObjectId(),
         id: id,
         date: fourYearDate,
         amount,
         accountNumber,
         routeNumber,
         reason: message,
         accountName,
         nameOfBank,
         nameOfCountry,
         status: 'Pending',
         user: userExist,
         transactionType: 'Transfer',
         sourceAccountNumber
      })


      let saveTransfer = await newTransfer.save()
      if (!saveTransfer) {
         let error = new Error("an error occurred on the server")
         return next(error)
      }
      // Create mailjet send email
      const mailjet = Mailjet.apiConnect(process.env.MAILJET_APIKEY, process.env.MAILJET_SECRETKEY
      )
      const requests = await mailjet.post("send", { 'version': 'v3.1' })
         .request({
            "Messages": [
               {
                  "From": {
                     "Email": "digitamon@digitamon.com",
                     "Name": "digitamon"
                  },
                  "To": [
                     {
                        "Email": `${userExist.email}`,
                        "Name": `${userExist.firstName}`
                     }
                  ],

                  "Subject": "DEBIT ALERT",
                  'TextPart':`Your request to transfer $${amount} from your  account ${userExist.accountNumber} to ${accountName} with account number  ${accountNumber} on ${fourYearDate} has been recieved and awaiting approval. Contact admin if there is an issue of delay`,
                  "HTMLPart": TransferRequestTemplate(amount, userExist.accountNumber, accountName, accountNumber, fourYearDate),
               }
            ]
         })

      if (!requests) {
         let error = new Error("an error occurred")
         return next(error)
      }


     /*
      //start sending sms
      let data = {
         "to": savedUser.phoneNumber,
         "from": "Coincap",
         "sms": `You have been debited  the sum of $${amount} from your  account ${savedUser.accountNumber} to ${accountName} with account number  ${accountNumber} on ${fourYearDate}`,
         "type": "plain",
         "api_key": process.env.TERMII_API_KEY,
         "channel": "generic",
      };
      var options = {
         'method': 'POST',
         'url': 'https://api.ng.termii.com/api/sms/send',
         'headers': {
            'Content-Type': ['application/json', 'application/json']
         },
         body: JSON.stringify(data)
      };
      request(options, function (error, response) {
         if (error) {
            console.log(error)
         }
         console.log(response);
      });
      */



      //finding beneficiaries with that name

      let beneficiariesFound = await Beneficiaries.findOne({
         accountName: accountName
      })


      //no beneficiaries and needs to add one
      if (!beneficiariesFound && addToFavorite) {

         let newbeneficiaries = new Beneficiaries({
            _id: new mongoose.Types.ObjectId(),
            accountName: accountName,
            accountNumber: accountNumber,
            bankName: nameOfBank,
            nameOfCountry: nameOfCountry,
            routeNumber: routeNumber,
            bankType: 'otherbank',
            user: userExist
         })

         let savedBeneficiaries = newbeneficiaries.save()

         if (!savedBeneficiaries) {
            let error = new Error("an error occurred on the server")
            return next(error)
         }
      }
       //fetch and retrieve all account 

       let allAccount = await Account.find({user:userExist})


      //send transfer object and savedUser to backend
      return res.status(200).json({
         response: {
            transfer: saveTransfer,
            allAccount:allAccount
         }
      })

   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}

module.exports.fetchAllAccount = async (req, res, next) => {
   try {
      
      let token = req.params.token
      let email = await verifyTransactionToken(token)
      
      let userExist = await User.findOne({ email: email })
      if (!userExist) {
         let error = new Error("user does not exist")
         return next(error)
      }
      let accounts = await Account.find({user:userExist})
     
      if (!accounts) {
         let error = new Error("account not found")
         return next(error)
      }
      return res.status(200).json({
         response:accounts
      })
   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}
//fetch all transfers for this account
module.exports.transfersToAccount = async (req, res, next) => {
   try {
      let token = req.params.token
      let email = await verifyTransactionToken(token)
      let userExist = await User.findOne({ email: email })

      if (!userExist) {
         let error = new Error("user does not exist")
         return next(error)
      }
      //retrieve deposit of this specific user
      let foundHistory = await History.find({ user: userExist })

      if (!foundHistory) {
         let error = new Error("an error occured")
         return next(error)
      }
      console.log(foundHistory)
      return res.status(200).json({
         response: foundHistory
      })

   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}
module.exports.history = async (req, res, next) => {
   try {
      let token = req.params.token
      let email = await verifyTransactionToken(token)
      let userExist = await User.findOne({ email: email })

      if (!userExist) {
         let error = new Error("user does not exist")
         return next(error)
      }


      //retrieve deposit of this specific user
      let foundHistory = await History.find({ user: userExist })

      if (!foundHistory) {
         let error = new Error("an error occured")
         return next(error)
      }

      return res.status(200).json({
         response: foundHistory
      })
   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}





//send otp code
module.exports.sendOtp = async (req, res, next) => {
   try {
      let token = req.params.token
      let email = await verifyTransactionToken(token)

      let userExist = await User.findOne({ email: email })

      if (!userExist) {
         let error = new Error("user does not exist")
         return next(error)
      }



      let oneTimePassword = userExist.oneTimePassword

      // Create mailjet send email
      const mailjet = Mailjet.apiConnect(process.env.MAILJET_APIKEY, process.env.MAILJET_SECRETKEY
      )

      const requests = await mailjet.post("send", { 'version': 'v3.1' })
         .request({
            "Messages": [
               {
                  "From": {
                     "Email": "digitamon@digitamon.com",
                     "Name": "digitamon"
                  },
                  "To": [
                     {
                        "Email": `${userExist.email}`,
                        "Name": `${userExist.firstName}`
                     }
                  ],

                  "Subject": "OTP",
                  "TextPart": `Your one time password is ${oneTimePassword}`,
                  "HTMLPart": OneTimePasswordTemplate(oneTimePassword),
               }
            ]
         })

      if (!requests) {
         let error = new Error("an error occurred")
         return next(error)
      }

      return res.status(200).json({
         response: 'an otp code was sent to your phone'
      })


   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}
//checking one time password of user
module.exports.checkOtp = async (req, res, next) => {
   try {
      let token = req.params.token
      let email = await verifyTransactionToken(token)

      let userExist = await User.findOne({ email: email })

      if (!userExist) {
         let error = new Error("user does not exist")
         return next(error)
      }

      let { isOtp } = req.body
      //API to send one time password

      if (userExist.oneTimePassword !== isOtp) {
         let error = new Error("incorrect code")
         return next(error)
      }
      userExist.otpVerified = true
      let savedUser = await userExist.save()
      return res.status(200).json({
         response:
         {
            user: savedUser
         }
      })
   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}
//fetching all beneficiaries
module.exports.beneficiaries = async (req, res, next) => {
   try {
      let token = req.params.token
      let email = await verifyTransactionToken(token)

      let userExist = await User.findOne({ email: email })

      if (!userExist) {
         let error = new Error("user does not exist")
         return next(error)
      }

      let beneficiaries = await Beneficiaries.find({ user: userExist })

      if (!beneficiaries) {
         let error = new Error("an error occured")
         return next(error)
      }

      return res.status(200).json({
         response: beneficiaries
      })
   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}
//creating beneficiaries
module.exports.createBeneficiaries = async (req, res, next) => {
   try {
      let token = req.params.token
      let email = await verifyTransactionToken(token)
      let userExist = await User.findOne({ email: email })
      if (!userExist) {
         let error = new Error("user does not exist")
         return next(error)
      }

      let {
         accountName,
         accountNumber,
         bankName,
         nameOfCountry,
         routeNumber,
         bankType
      } = req.body



      // creating new beneficiaries


      const newBeneficiaries = new Beneficiaries({
         _id: new mongoose.Types.ObjectId(),
         accountName,
         accountNumber,
         bankType,
         bankName,
         nameOfCountry,
         routeNumber,
         user: userExist
      })


      let saveBeneficiaries = await newBeneficiaries.save()

      if (!saveBeneficiaries) {
         let error = new Error("user does not exist")
         return next(error)
      }

      return res.status(200).json({
         response: 'Beneficiary added successfully'
      })
   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}

module.exports.deleteBeneficiaries = async (req, res, next) => {
   try {
      let token = req.params.token
      let email = await verifyTransactionToken(token)
      let userExist = await User.findOne({ email: email })
      if (!userExist) {
         let error = new Error("user does not exist")
         return next(error)
      }

      let { id } = req.body

      let deletedBeneficiary = await Beneficiaries.deleteOne({ _id: id })

      if (!deletedBeneficiary) {
         let error = new Error("an error occured")
         return next(error)
      }

      //find every other  benefeciaries by the same user

      let beneficiaries = await Beneficiaries.find({ user: userExist })

      if (!beneficiaries) {
         let error = new Error("an error occured")
         return next(error)
      }

      // creating new beneficiaries

      return res.status(200).json({
         response: beneficiaries
      })
   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}






//fetch all notification for this account
module.exports.getNotifications = async (req, res, next) => {
   try {
      let token = req.params.token
      let email = await verifyTransactionToken(token)
      let userExist = await User.findOne({ email: email })
      if (!userExist) {
         let error = new Error("user does not exist")
         return next(error)
      }
      let notifications = await Notification.find({ user: userExist })

      if (!notifications) {
         let error = new Error("an error occured")
         return next(error)
      }
      // creating new beneficiaries

      return res.status(200).json({
         response: notifications
      })
   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}
module.exports.deleteNotification = async (req, res, next) => {
   try {
      let token = req.params.token
      console.log(req.body)
      let email = await verifyTransactionToken(token)
      let userExist = await User.findOne({ email: email })
      if (!userExist) {
         let error = new Error("user does not exist")
         return next(error)
      }
      let id  = req.params.id


      console.log(req.body)
      let notification = await Notification.deleteOne({ _id: id })
      if (!notification) {
         let error = new Error("an error occured")
         return next(error)
      }

      //find every other  notifications by the same user

      let notifications = await Notification.find({ user: userExist })

      if (!notifications) {
         let error = new Error("an error occured")
         return next(error)
      }

      // creating new notifications
      return res.status(200).json({
         response: notifications
      })
   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}


/*
User.deleteOne({email:'hackerthron211@gmail.com'}).then(data=>{
   console.log(data)
})*/