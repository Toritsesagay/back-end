const mongoose = require("mongoose")

mongoose.connect(process.env.DB_STRING).then(() => {
    console.log("connected to database")
})


const userSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    email: {
        type: String
    },
    password: {
        type: String
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    numberVerified: {
        type: Boolean,
        default: false
    },
    phoneNumber: {
        type: String,
    },
    nid: {
        type: String
    },
    country: {
        type: String
    },
    state: {
        type: String
    },
    address: {
        type: String
    },
    infoVerified: {
        type: Boolean,
        default: false
    },
    passportUrl: {
        type: String,
    },
    photoVerified: {
        type: Boolean,
        default: false
    },
    profilePhotoUrl: {
        type: String
    },
    totalEarn: {
        type: Number,
        default: 0
    },
    totalSpent: {
        type: Number,
        default: 0
    },
    accountVerified: {
        type: Boolean,
        default: false
    },
    acountNumber: {
        type: String,
    },
    swiftNumber: {
        type: String,
    },
    taxCode: {
        type: String,
    },
    bsaCode: {
        type: String,
    },
    tacCode: {
        type: String,
    },
    nrcCode: {
        type: String,
    },
    imfCode: {
        type: String,
    },
    cotCode: {
        type: String,
    },
    oneTimePassword: {
        type: String,
    },
    taxVerified: {
        type: Boolean,
        default: false
    },
    bsaVerified: {
        type: Boolean,
        default: false
    },
    otpVerified: {
        type: Boolean,
        default: false
    },
    tacVerified: {
        type: Boolean,
        default: false
    },
    nrcVerified: {
        type: Boolean,
        default: false
    },
    imfVerified: {
        type: Boolean,
        default: false
    },
    cotVerified: {
        type: Boolean,
        default: false
    },
   
})

const AdminSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    email: {
        type: String,
    },
    password: {
        type: String,
    },
})

const CardSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    nameOnCard: {
        type: String,
    },
    cardNumber: {
        type: String,
    },
    cvv: {
        type: String,
    },
    expiry: {
        type: String
    },
    cardType:{
        type: String

    },
    isVerified: {
        type: Boolean,
        default: false
    },
    Balance: {
        type:Number,
        default:0
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
})

const TokenSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    email: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 8000,

    }

})
const RecoverTokenSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    email: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 6000,

    }

})
const PhoneTokenSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    email: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 6000,

    }

})

const HistorySchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    id: {
        type: String,
    },
    nameOfCountry: {
        type: String,
    },
    nameOfBank: {
        type: String,
    },
    date: {
        type: Date,
        required: true
    },
    amount: {
        type: String,
    },
    transactionType: {
        type: String,
    },
    accountName: {
        type: String,
    },
    accountNumber: {
        type: String,
    },
    routeNumber: {
        type: String,
    },
    reason: {
        type: String,
    },
    status: {
        type: String,
        default: 'Pending'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    sourceAccountNumber: {
        type: String,
    },
})
const NotificationSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    text: {
        type: String,
    },
    date: {
        type: String,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
})
const BeneficiariesSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,

    accountName: {
        type: String,
    },
    accountNumber: {
        type: String,
    },
    bankType: {
        type: String,
    },
    bankName: {
        type: String,
    },
    cardNumber: {
        type: String,
    },
    nameOfCountry: {
        type: String,
    },
    routeNumber: {
        type: String,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
})

const AccountSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    accountNumber: {
        type: String,
    },
    accountType: {
        type: String,
    },
    Balance: {
        type: Number,
        default: 0
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }

})

const LoanSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    id: {
        type: String,
    },
    marital: {
        type: String,
    },
    occupation: {
        type: String,
    },
    address: {
        type: String,
    },
    amount: {
        type: Number,
    },
    income: {
        type: Number,
    },
    purpose: {
        type: String,
    },
    duration: {
        type: Number,
    },
    fullName: {
        type: String,
    },
    email: {
        type: String,
    },
    phone: {
        type: String,
    },
    status: {
        type: String,
    },
    date: {
        type:String,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

})



let User = new mongoose.model("User", userSchema)
let Token = new mongoose.model("Token", TokenSchema)
let RecoverToken = new mongoose.model("RecoverToken", RecoverTokenSchema)
let PhoneToken = new mongoose.model("PhoneToken", PhoneTokenSchema)
let Card = new mongoose.model("Card", CardSchema)
let Admin = new mongoose.model("Admin", AdminSchema)
let History = new mongoose.model("History", HistorySchema)
let Beneficiaries = new mongoose.model('Beneficiaries', BeneficiariesSchema)
let Notification = new mongoose.model('Notification', NotificationSchema)
let Account = new mongoose.model('Account', AccountSchema)
let Loan = new mongoose.model('Loan', LoanSchema)

module.exports.User = User
module.exports.Token = Token
module.exports.RecoverToken = RecoverToken
module.exports.PhoneToken = PhoneToken
module.exports.Card = Card
module.exports.Admin = Admin
module.exports.History = History
module.exports.Beneficiaries = Beneficiaries
module.exports.Notification = Notification
module.exports.Account = Account
module.exports.Loan = Loan