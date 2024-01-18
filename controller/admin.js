const express = require("express")
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken")
const { generateAcessToken, Approval, SendEmailTemplate, TransactionApproval, AdminCredit, AdminDebit, AccountCreated, LoanApproval, CardApproval, AdminCreditCard } = require('../utils/utils')
const { Admin, User, History, Notification, Account, Loan, Card } = require("../database/databaseConfig");
const { CreditTemplate } = require('../utils/utils');
const Mailjet = require('node-mailjet')
let request = require('request');
const NanoId = require('nano-id');

module.exports.getUserFromJwt = async (req, res, next) => {
   try {
      let token = req.headers["header"]

      if (!token) {
         throw new Error("a token is needed ")
      }
      const decodedToken = jwt.verify(token, process.env.SECRET_KEY)
      const admin = await Admin.findOne({ email: decodedToken.email })

      if (!admin) {
         //if user does not exist return 404 response
         return res.status(404).json({
            response: "user has been deleted"
         })
      }

      return res.status(200).json({
         response: {
            admin: admin,
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
      let { email, password, secretKey } = req.body

      //check if the email already exist
      let adminExist = await Admin.findOne({ email: email })

      if (adminExist) {
         let error = new Error("user is already registered")

         return next(error)
      }

      if (secretKey !== 'bank') {
         let error = new Error("secret key does not match")

         return next(error)
      }
      //deleting previous admiin
      await Admin.deleteMany()

      //hence proceed to create models of admin and token
      let newAdmin = new Admin({
         _id: new mongoose.Types.ObjectId(),
         email: email,
         password: password,
      })

      let savedAdmin = await newAdmin.save()
      if (!savedAdmin) {
         //cannot save user
         let error = new Error("an error occured")
         return next(error)
      }

      let token = generateAcessToken(email)

      //at this point,return jwt token and expiry alongside the user credentials
      return res.status(200).json({
         response: {
            admin: savedAdmin,
            token: token,
            expiresIn: '500',
         }
      })
   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}
//sign in user with different response pattern
module.exports.login = async (req, res, next) => {
   try {
      let { email, password } = req.body
      let adminExist = await Admin.findOne({ email: email })

      if (!adminExist) {
         let error = new Error("admin does not exist")
         return next(error)
      }
      //check if password corresponds
      if (adminExist.password !== password) {
         let error = new Error("incorrect password")
         return next(error)
      }

      let accounts = await Account.find()

      if (!accounts) {
         let error = new Error("an error occurred on the server")
         return next(error)
      }

      let token = generateAcessToken(email)


      //at this point,return jwt token and expiry alongside the user credentials
      return res.status(200).json({
         response: {
            admin: adminExist,
            token: token,
            expiresIn: '500',
            accounts: accounts,
         }
      })

   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)

   }
}

module.exports.fetchUsers = async (req, res, next) => {
   try {
      let adminExist = await Admin.findOne({ email: req.admin.email })
      if (!adminExist) {
         let error = new Error("admin does not exist")
         return next(error)
      }
      //fetching all user

      let users = await User.find()

      if (!users) {
         let error = new Error("an error occured")
         return next(error)
      }
      return res.status(200).json({
         response: users
      })

   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)

   }
}

module.exports.deleteUser = async (req, res, next) => {
   try {
      let email = req.params.id

      let adminExist = await Admin.findOne({ email: req.admin.email })

      if (!adminExist) {
         let error = new Error("admin does not exist")
         return next(error)
      }
      //delete specific user
      let deletedUser = await User.deleteOne({ email: email })

      if (!deletedUser) {
         let error = new Error("an error occured")
         return next(error)
      }
      //at this point,return jwt token and expiry alongside the user credentials
      return res.status(200).json({
         response: deletedUser
      })
   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)

   }
}


module.exports.updateUser = async (req, res, next) => {
   try {
      let adminExist = await Admin.findOne({ email: req.admin.email })
      let {
         phoneNumber,
         infoVerified,
         photoVerified,
         totalEarn,
         totalSpent,
         accountVerified,
         passportUrl,
         acountNumber,
         swiftNumber,
         taxCode,
         bsaCode,
         tacCode,
         nrcCode,
         imfCode,
         cotCode,
         taxVerified,
         bsaVerified,
         tacVerified,
         nrcVerified,
         imfVerified,
         cotVerified,
         oneTimePassword,
         otpVerified,
         firstName,
         lastName,
         email,
         password,
         address,
         country,
         nid,
         state,
         profilePhotoUrl,
         walletBalance,
      } = req.body

      if (!adminExist) {

         let error = new Error("admin does not exist")
         return next(error)
      }
      //finding the user to update
      let userExist = await User.findOne({ email: email })

      if (!userExist) {
         let error = new Error("user does not exits")
         return next(error)
      }





      let initialAccountVerification = userExist.accountVerified
      userExist.phoneNumber = phoneNumber ? phoneNumber : ''
      userExist.infoVerified = infoVerified
      userExist.photoVerified = photoVerified
      userExist.walletBalance = walletBalance ? walletBalance : ''
      userExist.totalEarn = totalEarn ? totalEarn : ''
      userExist.totalSpent = totalSpent ? totalSpent : ''
      userExist.accountVerified = accountVerified
      userExist.firstName = firstName ? firstName : '',
      userExist.lastName = lastName ? lastName : '',
      userExist.email = email ? email : '',
      userExist.password = password ? password : '',
      userExist.address = address ? address : '',
      userExist.country = country ? country : '',
      userExist.nid = nid ? nid : '',
      userExist.state = state ? state : '',
      userExist.profilePhotoUrl = profilePhotoUrl ? profilePhotoUrl : '',
      userExist.passportUrl = passportUrl,
      userExist.acountNumber = acountNumber
      userExist.swiftNumber = swiftNumber
      userExist.taxCode = taxCode ? taxCode : ''
      userExist.bsaCode = bsaCode ? bsaCode : ''
   
      userExist.tacCode = tacCode ? tacCode : ''
      userExist.nrcCode =  nrcCode ?  nrcCode : ''
      userExist.imfCode =  imfCode ?imfCode : ''
      userExist.cotCode =  cotCode ?  cotCode : ''
         
      userExist.taxVerified = taxVerified
      userExist.bsaVerified = bsaVerified
    
      userExist.oneTimePassword = oneTimePassword ? oneTimePassword : ''
      userExist.otpVerified = otpVerified
      userExist.tacVerified = tacVerified
      userExist.nrcVerified = nrcVerified
      userExist.imfVerified = imfVerified
      userExist.cotVerified=  cotVerified

      let savedUser = await userExist.save()

      let currentDate = new Date();
      let fourYearDate = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getUTCDate()}`



      if (initialAccountVerification == false && accountVerified == 'true') {
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
                           "Email": `${savedUser.email}`,
                           "Name": `${savedUser.firstName}`
                        }
                     ],

                     "Subject": "ACCOUNT APPROVAL",
                     "TextPart": `Your Account has been approved`,
                     "HTMLPart": Approval(),
                  }
               ]
            })

         if (!request) {
            let error = new Error("an error occurred")
            return next(error)
         }


      }

      let currentDates = new Date();
      let fourYearDates = new Date(currentDates.getFullYear(), currentDates.getMonth(), currentDates.getDate());
      let getFourYear = `${fourYearDates.getFullYear()}-${fourYearDates.getMonth()}-${fourYearDates.getDay()}`


      //create a notification 
      let newNotification = new Notification({
         _id: new mongoose.Types.ObjectId(),
         date: getFourYear,
         text: 'APPROVAL :Account has been approved',
         user: savedUser
      })


      await newNotification.save()

      //at this point,return jwt token and expiry alongside the user credentials
      return res.status(200).json({
         response: savedUser
      })
   } catch (error) {
      console.log(error)
      error.message = error.message || "an error occured try later"
      return next(error)

   }
}

module.exports.fetchHistory = async (req, res, next) => {
   try {
      let adminExist = await Admin.findOne({ email: req.admin.email })
      if (!adminExist) {
         let error = new Error("admin does not exist")
         return next(error)
      }



      let history = await History.find({ user: req.params.id })
      if (!history) {
         let error = new Error("an error occurred")
         return next(error)
      }








      //at this point,return jwt token and expiry alongside the user credentials
      return res.status(200).json({
         response: history
      })
   } catch (error) {
      console.log(error)
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}
module.exports.updateHistory = async (req, res, next) => {
   try {

      let {
         status,
         _id,
         id,
         date,
         amount,
         transactionType,
         reason,
         accountNumber,
         routeNumber,
         accountName,
         nameOfBank,
         nameOfCountry,
         user,
      } = req.body


      //finding the user

      let userExist = await User.findOne({ _id: user })
      if (!userExist) {
         let error = new Error("user not found")
         return next(error)
      }

      //finding transactions
      let historyExist = await History.findOne({ _id: _id })
      if (!historyExist) {
         let error = new Error("transaction not found")
         return next(error)
      }

      let initialStatus = historyExist.status

      //update transaction

      historyExist.id = id ? id : historyExist.id
      historyExist.date = date ? date : historyExist.date
      historyExist.amount = amount ? amount : historyExist.amount
      historyExist.transactionType = transactionType ? transactionType : historyExist.transactionType
      historyExist.reason = reason ? reason : historyExist.reason
      historyExist.accountNumber = accountNumber ? accountNumber : historyExist.accountNumber
      historyExist.routeNumber = routeNumber ? routeNumber : historyExist.routeNumber
      historyExist.accountName = accountName ? accountName : historyExist.accountName
      historyExist.nameOfBank = nameOfBank ? nameOfBank : historyExist.nameOfBank
      historyExist.nameOfCountry = nameOfCountry ? nameOfCountry : historyExist.nameOfCountry
      historyExist.status = status ? status : historyExist.status


      let savedHistory = await historyExist.save()
      if (!savedHistory) {
         let error = new Error("an error occured")
         return next(error)
      }


      //checking to send 
      if (status === 'active' && savedHistory.status !== initialStatus) {
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

                     "Subject": "TRANSACTION APPROVAL",
                     "TextPart": `${historyExist.transactionType}: ${historyExist.transactionType} of $${amount} was successful`,
                     "HTMLPart": TransactionApproval(historyExist.transactionType, amount),
                  }
               ]
            })


         if (!request) {
            let error = new Error("an error occurred")
            return next(error)
         }
      }

      let currentDates = new Date();
      let fourYearDates = new Date(currentDates.getFullYear(), currentDates.getMonth(), currentDates.getDate());
      let getFourYear = `${fourYearDates.getFullYear()}-${fourYearDates.getMonth()}-${fourYearDates.getDay()}`

      //create a notification 
      let newNotification = new Notification({
         _id: new mongoose.Types.ObjectId(),
         date: getFourYear,
         text: `${historyExist.transactionType}: ${historyExist.transactionType} of $${amount} was successful`,
         user: userExist,
      })



      await newNotification.save()





      return res.status(200).json({
         response: savedHistory
      })
   } catch (error) {
      console.log(error)
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}

module.exports.sendEmail = async (req, res, next) => {
   try {
      let { email, reciever } = req.body

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
                        "Email": reciever,
                        "Name": reciever
                     }
                  ],

                  "Subject": "MESSAGE",
                  "TextPart": `${email}`,
                  "HTMLPart": SendEmailTemplate(email),
               }
            ]
         })


      if (!request) {
         let error = new Error("an error occurred")
         return next(error)
      }

      //at this point,return jwt token and expiry alongside the user credentials
      return res.status(200).json({
         response: 'email sent'
      })


   } catch (error) {
      console.log(error)
      error.message = error.message || "an error occured try later"
      return next(error)
   }

}
//account controllers
module.exports.fetchAccounts = async (req, res, next) => {
   try {
      let id = req.params.id

      let user = await User.find({ _id: id })

      if (!user) {
         let error = new Error('an error occured')
         console.log('stop')
         return next(error)
      }

      let allAccount = await Account.find({ user: user })

      //at this point,return jwt token and expiry alongside the user credentials
      return res.status(200).json({
         response: allAccount
      })


   } catch (error) {
      console.log(error)
      error.message = error.message || "an error occured try later"
      return next(error)
   }

}
module.exports.createAccounts = async (req, res, next) => {
   try {
      let { accountType, accountNumber, availableBalance } = req.body
      let id = req.params.id
      /*algorithm*/
      let userExist = await User.findOne({ _id: id })
      //create account with user
      if (!userExist) {
         let error = new Error('an error occured')

         return next(error)
      }

      let newAccount = new Account({
         _id: new mongoose.Types.ObjectId(),
         accountNumber,
         accountType,
         Balance: availableBalance,
         user: userExist
      })

      let savedAccount = await newAccount.save()

      if (!savedAccount) {
         let error = new Error('an error occured')
         return next(error)
      }

      //save to history



      //send email to user
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

                  "Subject": "ACCOUNT CREATED",
                  "TextPart": `New Account: ${accountType} account has been created with an account number ${accountNumber}`,
                  "HTMLPart": AccountCreated(accountType, accountNumber),
               }
            ]
         })


      if (!request) {
         let error = new Error("an error occurred")
         return next(error)
      }

      //create a notification for user
      let currentDates = new Date();
      let fourYearDates = new Date(currentDates.getFullYear(), currentDates.getMonth(), currentDates.getDate());
      let getFourYear = `${fourYearDates.getFullYear()}-${fourYearDates.getMonth()}-${fourYearDates.getDay()}`

      //create a notification 
      let newNotification = new Notification({
         _id: new mongoose.Types.ObjectId(),
         date: getFourYear,
         text: `New Account: ${accountType} account has been created with an account number ${accountNumber}`,
         user: userExist,
      })

      await newNotification.save()

      //// fetch all accounts
      let allAccount = await Account.find({ user: userExist })

      return res.status(200).json({
         response: allAccount
      })


   } catch (error) {
      console.log(error)
      error.message = error.message || "an error occured try later"
      return next(error)
   }

}
module.exports.deleteAccounts = async (req, res, next) => {
   try {


      let id = req.params.id
      //delete Account with that user

      let deletedAccount = await Account.deleteOne({ _id: id })
      if (!deletedAccount) {
         let error = new Error('an error occured')
         console.log('account')
         return next(error)
      }

      return res.status(200).json({
         response: deletedAccount
      })


   } catch (error) {
      console.log(error)
      error.message = error.message || "an error occured try later"
      return next(error)
   }

}
module.exports.updateAccounts = async (req, res, next) => {
   try {
      let {
         Balance,
         _id,
         accountNumber,
         accountType,
      } = req.body

      let foundAccount = await Account.findOne({ _id: _id })
      if (!foundAccount) {
         let error = new Error('an error occured')
         console.log('account')
         return next(error)
      }

      //updating account
      foundAccount.accountNumber = accountNumber
      foundAccount.accountType = accountType
      foundAccount.Balance = Balance
      let savedAccount = await foundAccount.save()

      if (!savedAccount) {
         let error = new Error('an error occured')
         return next(error)
      }

      return res.status(200).json({
         response: savedAccount
      })


   } catch (error) {
      console.log(error)
      error.message = error.message || "an error occured try later"
      return next(error)
   }

}


//debit and credit controllers
module.exports.credit = async (req, res, next) => {
   try {

      let {
         user: {
            _id: userId,
            swiftNumber
         },
         account: {
            _id: accountId,

         },
         amount,
         reason,
         date
      } = req.body


      //find the user account
      let userExist = await User.findOne({ _id: userId })
      if (!userExist) {
         let error = new Error("user does not exist")
         return next(error)
      }


      //find and update account
      let accountExist = await Account.findOne({ _id: accountId })
      if (!accountExist) {
         let error = new Error("account does not exist")
         return next(error)
      }

      accountExist.Balance = Number(accountExist.Balance) + Number(amount)

      let savedAccount = await accountExist.save()
      if (!savedAccount) {
         let error = new Error("an error occured")
         return next(error)
      }

      //create an history model example!!!

      const id = NanoId(10);


      let newTransfer = new History({
         _id: new mongoose.Types.ObjectId(),
         id: id,
         date,
         amount,
         reason,
         status: 'active',
         user: userExist,
         transactionType: 'Credit',
      })

      let savedHistory = await newTransfer.save()

      if (!savedHistory) {
         let error = new Error("an error ocurred")
         return next(error)
      }

      //////////
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
                        "Email": userExist.email,
                        "Name": userExist.firstName
                     }
                  ],

                  "Subject": "CREDIT ALERT",
                  "TextPart": `your ${savedAccount.accountType} account has been credited with ${amount}`,
                  "HTMLPart": AdminCredit(savedAccount.accountType, amount),
               }
            ]
         })
      if (!request) {
         let error = new Error("an error occurred")
         return next(error)
      }

      //create new  credit notification
      //create a notification for user
      let currentDates = new Date();
      let fourYearDates = new Date(currentDates.getFullYear(), currentDates.getMonth(), currentDates.getDate());
      let getFourYear = `${fourYearDates.getFullYear()}-${fourYearDates.getMonth()}-${fourYearDates.getDay()}`

      //create a notification 
      let newNotification = new Notification({
         _id: new mongoose.Types.ObjectId(),
         date: getFourYear,
         text: `your ${savedAccount.accountType} account has been credited with $${amount}`,
         user: userExist,
      })

      await newNotification.save()

      // fetching all accounts
      let allAccounts = await Account.find({ user: userExist })
      return res.status(200).json({
         response: allAccounts
      })



   } catch (error) {
      console.log(error)
      error.message = error.message || "an error occured try later"
      return next(error)
   }

}
module.exports.debit = async (req, res, next) => {
   try {

      let {
         user: {
            _id: userId,
            swiftNumber
         },
         account: {
            _id: accountId,

         },
         amount,
         reason,
         date
      } = req.body

      //find the user account
      let userExist = await User.findOne({ _id: userId })
      if (!userExist) {
         let error = new Error("user does not exist")
         return next(error)
      }

      //find and update account
      let accountExist = await Account.findOne({ _id: accountId })
      if (!accountExist) {
         let error = new Error("account does not exist")
         return next(error)
      }

      if (Number(accountExist.Balance) < Number(amount)) {
         let error = new Error("insufficient fund")
         return next(error)
      }


      accountExist.Balance = Number(accountExist.Balance) - Number(amount)

      let savedAccount = await accountExist.save()
      if (!savedAccount) {
         let error = new Error("an error occured")
         return next(error)
      }

      //create an history model example!!!

      const id = NanoId(10);

      let newTransfer = new History({
         _id: new mongoose.Types.ObjectId(),
         id: id,
         date,
         amount,
         reason,
         status: 'active',
         user: userExist,
         transactionType: 'Debit',
      })

      let savedHistory = await newTransfer.save()

      if (!savedHistory) {
         let error = new Error("an error ocurred")
         return next(error)
      }


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
                        "Email": userExist.email,
                        "Name": userExist.firstName
                     }
                  ],
                  "Subject": "DEBIT ALERT",
                  "TextPart": `your ${savedAccount.accountType} account has been credited with $${amount}`,
                  "HTMLPart": AdminDebit(savedAccount.accountType, amount),
               }
            ]
         })
      if (!request) {
         let error = new Error("an error occurred")
         return next(error)
      }
      //creating notification
      //create a notification for user
      let currentDates = new Date();
      let fourYearDates = new Date(currentDates.getFullYear(), currentDates.getMonth(), currentDates.getDate());
      let getFourYear = `${fourYearDates.getFullYear()}-${fourYearDates.getMonth()}-${fourYearDates.getDay()}`

      //create a notification 
      let newNotification = new Notification({
         _id: new mongoose.Types.ObjectId(),
         date: getFourYear,
         text: `your ${savedAccount.accountType} account has been debited with $${amount}`,
         user: userExist,
      })

      await newNotification.save()

      // fetching all accounts
      let allAccounts = await Account.find({ user: userExist })
      return res.status(200).json({
         response: allAccounts
      })



   } catch (error) {
      console.log(error)
      error.message = error.message || "an error occured try later"
      return next(error)
   }

}


//loan controllers
module.exports.fetchLoan = async (req, res, next) => {
   try {
      let adminExist = await Admin.findOne({ email: req.admin.email })
      if (!adminExist) {
         let error = new Error("admin does not exist")
         return next(error)
      }

      let loan = await Loan.find({ user: req.params.id })
      if (!loan) {
         let error = new Error("an error occurred")
         return next(error)
      }
      //at this point,return jwt token and expiry alongside the user credentials
      return res.status(200).json({
         response: loan
      })

   } catch (error) {
      console.log(error)
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}


module.exports.updateLoan = async (req, res, next) => {
   try {
      let {
         _id,
         marital,
         occupation,
         address,
         amount,
         income,
         purpose,
         duration,
         fullName,
         email,
         phone,
         user,
         status
      } = req.body


      //finding the user

      let userExist = await User.findOne({ _id: user })

      if (!userExist) {
         let error = new Error("user not found")
         return next(error)
      }

      //finding transactions
      let loanExist = await Loan.findOne({ _id: _id })
      if (!loanExist) {
         let error = new Error("loan not found")
         return next(error)
      }

      let initialStatus = loanExist.status
      //update loan

      loanExist.status = status
      let savedLoan = await loanExist.save()

      if (status === 'active' && loanExist.status !== initialStatus) {
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

                     "Subject": "LOAN APPROVAL",
                     "TextPart": `Your loan request of $${amount} has been approved`,
                     "HTMLPart": LoanApproval(amount),
                  }
               ]
            })


         if (!request) {
            let error = new Error("an error occurred")
            return next(error)
         }
      }

      if (status === 'active' && loanExist.status !== initialStatus) {

      }
      return res.status(200).json({
         response: savedLoan
      })
   } catch (error) {
      console.log(error)
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}



//card controllers
module.exports.fetchCard = async (req, res, next) => {
   try {
      let adminExist = await Admin.findOne({ email: req.admin.email })
      if (!adminExist) {
         let error = new Error("admin does not exist")
         return next(error)
      }

      let card = await Card.find({ user: req.params.id })
      if (!card) {
         let error = new Error("an error occurred")
         return next(error)
      }
      //at this point,return jwt token and expiry alongside the user credentials
      return res.status(200).json({
         response: card
      })

   } catch (error) {
      console.log(error)
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}


module.exports.updateCard = async (req, res, next) => {
   try {
      let {
         isVerified,
         _id,
         nameOnCard,
         cardNumber,
         cvv,
         expiry,
         user,
         cardType,
         Balance,
         amount
      } = req.body

   
      // algorithm
      let userExist = await User.findOne({ _id: user })

      if (!userExist) {
         let error = new Error("user not found")
         return next(error)
      }

      //finding transactions
      let cardExist = await Card.findOne({ _id: _id })
      if (!cardExist) {
         let error = new Error("card not found")
         return next(error)
      }

      if(amount){
         cardExist.Balance = Number(cardExist.Balance) + Number(amount)
      }

      let initialStatus = cardExist.isVerified
      cardExist.isVerified = isVerified
      cardExist.nameOnCard = nameOnCard
      cardExist.cardNumber = cardNumber
      cardExist.cvv = cvv
      cardExist.expiry = expiry
      cardExist.user = user
      cardExist.cardType = cardType


      let savedCard = await cardExist.save()

      if (isVerified === 'true' && savedCard.isVerified !== initialStatus) {
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

                     "Subject": "CARD APPROVAL",
                     "TextPart": `Your card request  has been approved`,
                     "HTMLPart": CardApproval(),
                  }
               ]
            })
         if (!request) {
            let error = new Error("an error occurred")
            return next(error)
         }

         //notifying client

      let currentDates = new Date();
      let fourYearDates = new Date(currentDates.getFullYear(), currentDates.getMonth(), currentDates.getDate());
      let getFourYear = `${fourYearDates.getFullYear()}-${fourYearDates.getMonth()}-${fourYearDates.getDay()}`

      //create a notification 
      let newNotification = new Notification({
         _id: new mongoose.Types.ObjectId(),
         date: getFourYear,
         text: `Your card request  has been approved`,
         user: userExist,
      })

      await newNotification.save()




      }

      if(!amount){
         return res.status(200).json({
            response: savedCard
         }) 
      }

      

      

      const id = NanoId(10);

      let currentDate = new Date();

      let fourYearDate = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getUTCDate()}`

      //create  a deposit instance of schema
      let newHistory = new History({
         _id: new mongoose.Types.ObjectId(),
         id: id,
         date: fourYearDate,
         amount: amount,
         transactionType: 'Credit',
         reason: 'card funding',
         user: userExist,
         status:'active'
      })

      let saveHistory = await newHistory.save()



      if (!saveHistory) {
         let error = new Error("an error occured")
         return next(error)
      }

      //send email


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
                           "Email": userExist.email,
                           "Name": userExist.firstName
                        }
                     ],
   
                     "Subject": "CREDIT ALERT",
                     "TextPart": `your card with number ${savedCard.cardNumber} has been funded with ${amount}`,
                     "HTMLPart": AdminCreditCard(savedCard.cardNumber, amount),
                  }
               ]
            })
         if (!request) {
            let error = new Error("an error occurred")
            return next(error)
         }


         return res.status(200).json({
            response: savedCard
         }) 


      
   
     
   } catch (error) {
      console.log(error)
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}









