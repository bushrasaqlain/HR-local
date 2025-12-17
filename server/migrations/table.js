const countryModel = require("../models/countryModel");
const districtModel = require("../models/districtModel");
const cityModel = require("../models/cityModel");
const degreetypeModel = require("../models/degreetypeModel");
const candidateModel = require("../models/candidateModel");
const degreeFieldModel = require("../models/degreeFieldModel");
const professionModel = require("../models/professionModel");
const businessentitytypeModel = require("../models/businessentitytypeModel");
const jobtypeModel = require("../models/jobtypeModel");
const bankModel = require("../models/bankModel");
const packageModel = require("../models/packageModel");
function Database() {

  countryModel.createCountriesTable();
  districtModel.createDistrictsTable();
  cityModel.createCitiesTable();
  degreetypeModel.createDegreeTypesTable();
  degreeFieldModel.createDegreeFieldsTable();
  professionModel.createProfessionsTable();
  businessentitytypeModel.createbusiness_entity_typeTable();
  jobtypeModel.createJobTypeTable();
  bankModel.createBankTable();
  packageModel.createPackagesTable();

  candidateModel.createCandidateTable();
  candidateModel.createCandidateAvailabilityTable();
  candidateModel.createCandidateSpecialityTable();
  candidateModel.createCandidatePreferredCitiesTable();
  candidateModel.createsaveJobsTableQuery();
  

}

Database();
