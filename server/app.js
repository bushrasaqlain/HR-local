const express = require("express");
const bodyParser = require("body-parser");
// Import the cors middleware
const cors = require("cors");
const connection = require("./connection");
require("./cron"); // This will start the cron job automatically

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(bodyParser.json());
// Require your route files

const job_description = require("./routes/job-description");

const Resume = require("./routes/Resumes");
const work_experience = require('./routes/Work &Experience')
const education = require('./routes/Education')
const projects = require("./routes/Projects");
const certificateAwards = require("./routes/CertificateAward");
const jobs = require("./routes/CandidateJobs")
const applications = require("./routes/CVs")
const messages = require("./routes/messages");

// const singlejob = require("./routes/singlejobdata")

// Use your routes
app.use("/job-description", job_description);

app.use("/resume", Resume)
app.use('/', work_experience)
app.use('/', education )
app.use('/', projects)
app.use('/', certificateAwards)
app.use('/',jobs)
app.use('/applications', applications)
app.use('/', messages)


// Require your route files
const companyRoute = require("./routes/employercompanyinfo");

const companylogo = require("./routes/getemployerdata");
const delete_employer_data= require("./routes/deleteemplyerdata");
const company_name = require("./routes/comapnyname");

const company_update = require("./routes/updatecompanyinfo")

const dbAdminHistory = require("./routes/dbAdminHistory");
const history = require("./routes/history");

// const singlejob = require("./routes/singlejobdata")
// Use your routes
app.use("/company-info", companyRoute);
app.use("/", companylogo);
app.use("/", delete_employer_data);
app.use("/", company_name);
app.use("/", company_update );

app.use("/", dbAdminHistory);
app.use("/", history);


const accountRoutes = require("./routes/accountRoutes");
const bank=require("./routes/bankRoutes");
const profession=require("./routes/professionRoutes");
const city=require("./routes/cityRoutes");
const jobtypes=require("./routes/jobtypeRoutes");
const skill=require("./routes/skillsRoutes");
const currency=require("./routes/currencyRoutes");
const countries=require("./routes/countryRoutes");
const degree=require("./routes/degreetypeRoutes");
const degreefields=require("./routes/degreeFieldRoutes");
const business_entity_type=require("./routes/businessentitytypeRoutes");
const district=require("./routes/districtRoutes");

const packages= require("./routes/packagesRoutes");
const cart= require("./routes/cartRoutes");

const candidate = require("./routes/candidateRoutes");

app.use("/", accountRoutes);


app.use("/",countries);
app.use("/",district);
app.use("/",city);
app.use("/",degree);
app.use("/",degreefields);
app.use("/",bank);
app.use ("/",skill);
app.use("/",jobtypes);
app.use("/",profession);
app.use("/",business_entity_type);
app.use ("/",currency);

app.use("/packages", packages);
app.use("/", cart);

app.use("/candidateProfile",candidate )

module.exports = app;
