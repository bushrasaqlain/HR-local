const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const countryModel = require("../models/countryModel");
const districtModel = require("../models/districtModel");
const cityModel = require("../models/cityModel");
const degreetypeModel = require("../models/degreetypeModel");
const candidateModel = require("../models/candidateModel");
const degreeFieldModel = require("../models/degreeFieldModel");
const businessentitytypeModel = require("../models/businessentitytypeModel");
const jobtypeModel = require("../models/jobtypeModel");
const bankModel = require("../models/bankModel");
const packageModel = require("../models/packageModel");
const emplyeeModel = require("../models/companyModel");
const historyModel = require("../models/historyModel")
const applicantModel = require("../models/applicantModel")
const jobModel = require("../models/jobModel")
const messageModel = require("../models/messageModel")
const licensetypesModel=require("../models/licensetypesModel")
const specialityModel=require("../models/specialityModel")
const instituteModel=require("../models/instituteModel")
const dbadminhistory =require("../models/dbHistoryModel")
const paymentModel=require("../models/paymentModel")
function Database() {

  countryModel.createCountriesTable();
  districtModel.createDistrictsTable();
  cityModel.createCitiesTable();
  degreetypeModel.createDegreeTypesTable();
  degreeFieldModel.createDegreeFieldsTable();
  businessentitytypeModel.createbusiness_entity_typeTable();
  jobtypeModel.createJobTypeTable();
  bankModel.createBankTable();
  packageModel.createPackagesTable();
  licensetypesModel.createLicenseTypesTable();
  specialityModel.createSpecialityTable();
  instituteModel.createInstituteTable();
  dbadminhistory.createDbAdminHistoryTable();

  emplyeeModel.createCompanyInfoTable();
  candidateModel.createCandidateTable();
  candidateModel.createCandidateAvailabilityTable();
  candidateModel.createCandidateSpecialityTable();
  candidateModel.createCandidatePreferredCitiesTable();
  candidateModel.createsaveJobsTableQuery();
  jobModel.createJobPostTable()
  paymentModel.createPaymentTable()
  applicantModel.createApplicantsTable();
  historyModel.createHistoryTable();
  messageModel.createMessagesTable()

}

Database();
