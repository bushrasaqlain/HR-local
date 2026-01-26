const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
// Import the cors middleware
const cors = require("cors");
const connection = require("./connection");
require("./cron"); 

const app = express();
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(bodyParser.json());

const accountRoutes = require("./routes/accountRoutes");
const bank = require("./routes/bankRoutes");
const city = require("./routes/cityRoutes");
const jobtypes = require("./routes/jobTypeRoutes");
const skill = require("./routes/skillsRoutes");
const currency = require("./routes/currencyRoutes");
const countries = require("./routes/countryRoutes");
const degree = require("./routes/degreetypeRoutes");
const degreefields = require("./routes/degreeFieldRoutes");
const business_entity_type = require("./routes/businessentitytypeRoutes");
const district = require("./routes/districtRoutes");
const candidateRoute = require("./routes/candidateRoutes");
const companyRoute = require("./routes/companyRoutes");
const history = require("./routes/historyRoutes");
const applicantRoute = require("./routes/applicantRoutes")
const packages = require("./routes/packagesRoutes");
const cart = require("./routes/cartRoutes");
const jobRoutes = require("./routes/jobRoutes");
const licensetypesRoutes = require("./routes/licensetypesRoutes");
const speciality = require("./routes/specialityRoutes");
const instituteRoutes = require("./routes/instituteRoutes")
const messages = require("./routes/messagesRoutes");
const paymentRoutes = require("./routes/paymentRoutes")
const candidate_educationRoutes = require("./routes/candidateeducationRoutes")
const candidate_experienceRoutes = require('./routes/candidateexperienceRoutes')
const resumeRoute = require("./routes/resumeRoutes");


const projects = require("./routes/projectsRoutes");
const certificateAwards = require("./routes/certificateawardRoutes");
const candidatejobs = require("./routes/candidatejobsRoutes")
const dbAdminHistory = require("./routes/dbHistoryRoutes");




app.use("/", accountRoutes);
app.use("/", countries);
app.use("/", district);
app.use("/", city);
app.use("/", degree);
app.use("/", degreefields);
app.use("/", bank);
app.use("/", skill);
app.use("/", jobtypes);
app.use("/", speciality);
app.use("/", business_entity_type);
app.use("/", currency);
app.use("/institute", instituteRoutes)
app.use("/", licensetypesRoutes);
app.use("/packages", packages);
app.use("/", cart);

app.use('/', projects)
app.use('/', certificateAwards)
app.use('/', candidatejobs)
app.use("/", history);
app.use("/", dbAdminHistory);

app.use("/candidateProfile", candidateRoute);
app.use("/candidateeducation", candidate_educationRoutes)
app.use("/candidateexperience", candidate_experienceRoutes)
app.use("/resume", resumeRoute)


app.use("/company-info", companyRoute);
app.use("/job", jobRoutes);
app.use("/", applicantRoute)
app.use('/message', messages)
app.use("/payment", paymentRoutes)



module.exports = app;
