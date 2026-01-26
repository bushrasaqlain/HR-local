const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// code to add extra column in specific table 
const connection = require("../connection"); // ✅ Correct path (assuming table.js is in server/migrations/)

function addColumn(tableName, columnName, dataType) {
  return new Promise((resolve) => {
    const checkSql = `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME}' 
        AND TABLE_NAME = '${tableName}' 
        AND COLUMN_NAME = '${columnName}'
    `;

    connection.query(checkSql, (err, results) => {
      if (err) {
        console.log(`❌ Error checking ${tableName}.${columnName}:`, err.message);
        resolve();
        return;
      }

      if (results.length === 0) {
        const sql = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${dataType}`;
        connection.query(sql, (err2, result) => {
          if (err2) {
            console.log(`❌ ${tableName}.${columnName} ->`, err2.message);
          } else {
            console.log(`✅ ${tableName}.${columnName} added`);
          }
          resolve();
        });
      } else {
        console.log(`✅ ${tableName}.${columnName} already exists`);
        resolve();
      }
    });
  });
}

// ends here 
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
const candidateeducationModel=require("../models/candidateeducationModel")

const accountModel=require("../models/accountModel")
const currency=require ("../models/currencyModel");
const skills=require("../models/skillsModel")

const candidateexperience=require("../models/candidateexperienceModel")
const candidateAvailabilityModel = require("../models/candidateAvailabilityModel");
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
  skills.createSkillsTable();
currency.createCurrenciesTable();
  accountModel.createAccountTable();
  emplyeeModel.createCompanyInfoTable();
  candidateModel.createCandidateTable();
  candidateModel.createCandidateSpecialityTable();
  candidateModel.createCandidatePreferredCitiesTable();
  // candidateModel.createsaveJobsTableQuery();
  jobModel.createJobPostTable()
  paymentModel.createPaymentTable()
  applicantModel.createApplicantsTable();
  historyModel.createHistoryTable();
  messageModel.createMessagesTable();
  candidateeducationModel.createEducationTable()
  candidateexperience.createExperienceTable()
  candidateAvailabilityModel.createCandidateAvailabilityTable();


  // adding extra column in job_posts table
  //  addColumn("test", "newkuchb", "VARCHAR(255)");
}

Database();
