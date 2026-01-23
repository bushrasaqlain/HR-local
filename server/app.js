const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
// Import the cors middleware
const cors = require("cors");
const connection = require("./connection");
require("./cron"); // This will start the cron job automatically

const app = express();
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(bodyParser.json());


const Resume = require("./routes/Resumes");
const work_experience = require('./routes/Work &Experience')
const education = require('./routes/EducationRoutes')
const projects = require("./routes/projectsRoutes");
const certificateAwards = require("./routes/certificateawardRoutes");
const jobs = require("./routes/candidatejobsRoutes")
const dbAdminHistory = require("./routes/dbHistoryRoutes");


app.use("/resume", Resume)
app.use('/', work_experience)
app.use('/', education )
app.use('/', projects)
app.use('/', certificateAwards)
app.use('/',jobs)
app.use("/", dbAdminHistory);

const accountRoutes = require("./routes/accountRoutes");
const bank=require("./routes/bankRoutes");
const city=require("./routes/cityRoutes");
const jobtypes=require("./routes/jobTypeRoutes");
const skill=require("./routes/skillsRoutes");
const currency=require("./routes/currencyRoutes");
const countries=require("./routes/countryRoutes");
const degree=require("./routes/degreetypeRoutes");
const degreefields=require("./routes/degreeFieldRoutes");
const business_entity_type=require("./routes/businessentitytypeRoutes");
const district=require("./routes/districtRoutes");
const candidateRoute = require("./routes/candidateRoutes");
const companyRoute = require("./routes/companyRoutes");
const history = require("./routes/historyRoutes");
const applicantRoute=require("./routes/applicantRoutes")
const packages= require("./routes/packagesRoutes");
const cart= require("./routes/cartRoutes");
const jobRoutes=require("./routes/jobRoutes");
const licensetypesRoutes=require("./routes/licensetypesRoutes");
const speciality=require("./routes/specialityRoutes");
const instituteRoutes=require("./routes/instituteRoutes")
const messages = require("./routes/messagesRoutes");
const paymentRoutes=require("./routes/paymentRoutes")

app.use("/", accountRoutes);
app.use("/company-info", companyRoute);
app.use("/job",jobRoutes);


app.use("/",applicantRoute)
app.use("/candidateProfile",candidateRoute );
app.use("/", history);

app.use("/",countries);
app.use("/",district);
app.use("/",city);
app.use("/",degree);
app.use("/",degreefields);
app.use("/",bank);
app.use ("/",skill);
app.use("/",jobtypes);
app.use("/",speciality);
app.use("/",business_entity_type);
app.use ("/",currency);
app.use("/institute",instituteRoutes)
app.use("/", licensetypesRoutes);
app.use("/packages", packages);
app.use("/", cart);



app.use('/message', messages)
app.use("/payment",paymentRoutes)



module.exports = app;
