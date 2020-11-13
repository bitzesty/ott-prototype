const express = require('express')
const axios = require('axios')
const router = express.Router()
const api_helper = require('./API_helper');
const { response } = require('express');

const Heading = require('./classes/heading.js');
const Commodity = require('./classes/commodity.js');
const Error_handler = require('./classes/error_handler.js');


require('./classes/global.js');

// Add your routes here - above the module.exports line

// Search page
router.get('/search', function (req, res) {
    axios.get('https://www.trade-tariff.service.gov.uk/api/v2/sections')
        .then((response) => {
            res.render('search', { 'search': response.data, 'date_string': global.todays_date() });
        });
});

// Browse page
router.get('/browse', function (req, res) {
    axios.get('https://www.trade-tariff.service.gov.uk/api/v2/sections')
        .then((response) => {
            res.render('browse', { 'sections': response.data, 'date_string': global.todays_date() });
        });
});

// Browse within a section
router.get('/sections/:sectionId', function (req, res) {
    axios.get('https://www.trade-tariff.service.gov.uk/api/v2/sections/' + req.params["sectionId"])
        .then((response) => {
            res.render('section', { 'section': response.data, 'date_string': global.todays_date() });
        });
});

// Browse within a chapter
router.get('/chapters/:chapterId', function (req, res) {
    s = req.params["chapterId"];
    s = s.padStart(2, "0");
    axios.get('https://www.trade-tariff.service.gov.uk/api/v2/chapters/' + s)
        .then((response) => {
            res.render('chapters', { 'chapter': response.data, 'date_string': global.todays_date() });
        });
});

// Browse within a heading
router.get('/headings/:headingId', function (req, res) {
    axios.get('https://www.trade-tariff.service.gov.uk/api/v2/headings/' + req.params["headingId"])
        .then((response) => {
            h = new Heading(response.data);
            res.render('headings', { 'heading': h, 'date_string': global.todays_date() });
        });
});

// Browse a single commodity
router.get('/commodities/:goods_nomenclature_item_id', function (req, res) {
    req.session.data["error"] = "";
    axios.get('https://www.trade-tariff.service.gov.uk/api/v2/commodities/' + req.params["goods_nomenclature_item_id"])
        .then((response) => {
            //res.render('commodities', { 'commodity': response.data, 'date_string': global.todays_date() });
            c = new Commodity();
            c.pass_request(req);
            c.get_data(response.data);
            c.get_measure_data("basic");
            res.render('commodities', { 'commodity': c, 'date_string': global.todays_date() });
        });
});



// A-Z index
router.get('/a-z-index/:letter', function (req, res) {
    var url = 'https://www.trade-tariff.service.gov.uk/api/v2/search_references.json?query[letter]=' + req.params["letter"];
    console.log(url);
    axios.get(url)
        .then((response) => {
            res.render('a-z-index', { 'headings': response.data, 'letter': req.params["letter"], alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'date_string': global.todays_date() });
        });
});

// Certificates (dead)
router.get('/certificate_search', function (req, res) {
    axios.get('https://www.trade-tariff.service.gov.uk/certificates/')
        .then((response) => {
            res.render('certificates', { 'certificates': response.data, 'date_string': global.todays_date() });
        });
});

// Calculator - Data handler
router.get('/calculate/data_handler/:goods_nomenclature_item_id', function (req, res) {
    var err, referer, c;
    console.log("Data handler");
    referer = req.headers.referer;

    if (referer.indexOf("date") !== -1) {
        // Validate the date form
        e = new Error_handler();
        contains_errors = e.validate_date(req); // Gets data from Date form and validates it
        if (contains_errors) {
            req.session.data["error"] = "date";
            res.redirect("/calculate/date/" + req.params["goods_nomenclature_item_id"]);
        } else {
            req.session.data["error"] = "";
            res.redirect("/calculate/destination/" + req.params["goods_nomenclature_item_id"]);
        }
    } else if (referer.indexOf("destination") !== -1) {
        // Validate the destination form
        console.log("Checking destination");
        e = new Error_handler();
        contains_errors = e.validate_destination(req); // Gets data from destination form and validates it
        if (contains_errors) {
            req.session.data["error"] = "destination";
            res.redirect("/calculate/destination/" + req.params["goods_nomenclature_item_id"]);
        } else {
            req.session.data["error"] = "";
            // Check if the MFN is 0.00. If it is, then there is no value in proceeding
            axios.get('https://www.trade-tariff.service.gov.uk/api/v2/commodities/' + req.params["goods_nomenclature_item_id"])
                .then((response) => {
                    c = new Commodity();
                    c.get_data(response.data);
                    if (c.basic_duty_rate == "0.00 %") {
                        res.redirect("/calculate/results/" + req.params["goods_nomenclature_item_id"]);
                    } else {
                        res.redirect("/calculate/origin/" + req.params["goods_nomenclature_item_id"]);
                    }

                });
        }
    } else if (referer.indexOf("origin") !== -1) {
        // Validate the origin form
        console.log("Checking origin");
        e = new Error_handler();
        contains_errors = e.validate_origin(req); // Gets data from origin form and validates it
        if (contains_errors) {
            req.session.data["error"] = "origin";
            res.redirect("/calculate/origin/" + req.params["goods_nomenclature_item_id"]);
        } else {
            req.session.data["error"] = "";
            res.redirect("/calculate/monetary_value/" + req.params["goods_nomenclature_item_id"]);
        }
    } else if (referer.indexOf("monetary_value") !== -1) {
        // Validate the monetary value form
        console.log("Checking monetary value");
        e = new Error_handler();
        contains_errors = e.validate_monetary_value(req); // Gets data from monetary svalue form and validates it
        if (contains_errors) {
            req.session.data["error"] = "monetary_value";
            res.redirect("/calculate/monetary_value/" + req.params["goods_nomenclature_item_id"]);
        } else {
            req.session.data["error"] = "";

            axios.get('https://www.trade-tariff.service.gov.uk/api/v2/commodities/' + req.params["goods_nomenclature_item_id"])
                .then((response) => {
                    c = new Commodity();
                    c.get_data(response.data);
                    c.get_measure_data(req.session.data["origin"]);
                    req.session.data["country_name"] = c.country_name;
                    if ((c.units.length > 0) || (c.meursing)) {
                        res.redirect("/calculate/unit_value/" + req.params["goods_nomenclature_item_id"]);
                    } else if (c.remedies.length > 0) {
                        res.redirect("/calculate/company/" + req.params["goods_nomenclature_item_id"]);
                    } else {
                        res.redirect("/calculate/confirm/" + req.params["goods_nomenclature_item_id"]);
                    }

                });
        }
    } else if (referer.indexOf("unit_value") !== -1) {
        // Validate the unit value form
        console.log("Checking unit value");
        e = new Error_handler();
        contains_errors = e.validate_unit_value(req); // Gets data from unit value form and validates it
        if (contains_errors) {
            req.session.data["error"] = "unit_value";
            res.redirect("/calculate/unit_value/" + req.params["goods_nomenclature_item_id"]);
        } else {
            req.session.data["error"] = "";
            axios.get('https://www.trade-tariff.service.gov.uk/api/v2/commodities/' + req.params["goods_nomenclature_item_id"])
                .then((response) => {
                    c = new Commodity();
                    c.get_data(response.data);
                    c.get_measure_data(req.session.data["origin"]);
                    req.session.data["country_name"] = c.country_name;
                    if (c.meursing) {
                        res.redirect("/calculate/meursing/" + req.params["goods_nomenclature_item_id"]);
                    } else if (c.remedies.length > 0) {
                        res.redirect("/calculate/company/" + req.params["goods_nomenclature_item_id"]);
                    } else {
                        res.redirect("/calculate/confirm/" + req.params["goods_nomenclature_item_id"]);
                    }
                });
        }
    } else if (referer.indexOf("meursing") !== -1) {
        // Validate the unit value form
        console.log("Checking Meursing code");
        e = new Error_handler();
        contains_errors = e.validate_meursing(req); // Gets data from meursing code form and validates it
        if (contains_errors) {
            req.session.data["error"] = "meursing";
            res.redirect("/calculate/meursing/" + req.params["goods_nomenclature_item_id"]);
        } else {
            req.session.data["error"] = "";
            axios.get('https://www.trade-tariff.service.gov.uk/api/v2/commodities/' + req.params["goods_nomenclature_item_id"])
                .then((response) => {
                    c = new Commodity();
                    c.get_data(response.data);
                    c.get_measure_data(req.session.data["origin"]);
                    req.session.data["country_name"] = c.country_name;
                    if (c.remedies.length > 0) {
                        res.redirect("/calculate/company/" + req.params["goods_nomenclature_item_id"]);
                    } else {
                        res.redirect("/calculate/confirm/" + req.params["goods_nomenclature_item_id"]);
                    }
                });
        }
    }
});



// Calculator - Date
router.get('/calculate/date/:goods_nomenclature_item_id', function (req, res) {
    console.log("Date");
    var err = req.session.data["error"];
    var import_date_day = req.session.data["import_date-day"];
    var import_date_month = req.session.data["import_date-month"];
    var import_date_year = req.session.data["import_date-year"];
    axios.get('https://www.trade-tariff.service.gov.uk/api/v2/commodities/' + req.params["goods_nomenclature_item_id"])
        .then((response) => {
            c = new Commodity();
            c.pass_request(req);
            c.get_data(response.data);
            res.render('calculate/01_date', { 'commodity': c, 'error': err, 'import_date_day': import_date_day, 'import_date_month': import_date_month, 'import_date_year': import_date_year });
        });
});

// Calculator - Destination
router.get('/calculate/destination/:goods_nomenclature_item_id', function (req, res) {
    console.log("Destination");
    var err = req.session.data["error"];
    var destination = req.session.data["destination"];
    axios.get('https://www.trade-tariff.service.gov.uk/api/v2/commodities/' + req.params["goods_nomenclature_item_id"])
        .then((response) => {
            res.render('calculate/02_destination', { 'commodity': response.data, 'error': err, 'destination': destination });
        });
});

// Calculator - Origin
router.get('/calculate/origin/:goods_nomenclature_item_id', function (req, res) {
    console.log("Origin");
    var err = req.session.data["error"];
    var origin = req.session.data["origin"];
    axios.get('https://www.trade-tariff.service.gov.uk/api/v2/commodities/' + req.params["goods_nomenclature_item_id"])
        .then((response) => {
            res.render('calculate/03_origin', { 'commodity': response.data, 'error': err, 'origin': origin });
        });
});

// Calculator - Monetary value
router.get('/calculate/monetary_value/:goods_nomenclature_item_id', function (req, res) {
    console.log("Monetary value");
    var err = req.session.data["error"];
    var monetary_value = req.session.data["monetary_value"];
    axios.get('https://www.trade-tariff.service.gov.uk/api/v2/commodities/' + req.params["goods_nomenclature_item_id"])
        .then((response) => {
            res.render('calculate/04_monetary_value', { 'commodity': response.data, 'error': err, 'monetary_value': monetary_value });
        });
});

// Calculator - Unit value
router.get('/calculate/unit_value/:goods_nomenclature_item_id', function (req, res) {
    console.log("Unit value");
    var err = req.session.data["error"];
    axios.get('https://www.trade-tariff.service.gov.uk/api/v2/commodities/' + req.params["goods_nomenclature_item_id"])
        .then((response) => {
            c = new Commodity();
            c.pass_request(req);
            c.get_data(response.data);
            c.get_measure_data(req.session.data["origin"]);
            res.render('calculate/05_unit_value', { 'commodity': c, 'error': err });
        });
});

// Calculator - Meursing
router.get('/calculate/meursing/:goods_nomenclature_item_id', function (req, res) {
    console.log("Meursing");
    var err = req.session.data["error"];
    axios.get('https://www.trade-tariff.service.gov.uk/api/v2/commodities/' + req.params["goods_nomenclature_item_id"])
        .then((response) => {
            res.render('calculate/06_meursing', { 'commodity': response.data, 'error': err });
        });
});

// Calculator - Company
router.get('/calculate/company/:goods_nomenclature_item_id', function (req, res) {
    console.log("Company");
    var err = req.session.data["error"];
    axios.get('https://www.trade-tariff.service.gov.uk/api/v2/commodities/' + req.params["goods_nomenclature_item_id"])
        .then((response) => {
            c = new Commodity();
            c.pass_request(req);
            c.phase = "company";
            c.get_data(response.data);
            c.get_measure_data(req.session.data["origin"]);
            res.render('calculate/07_company', { 'commodity': c, 'error': err });
        });
});

// Calculator - Confirm
router.get('/calculate/confirm/:goods_nomenclature_item_id', function (req, res) {
    console.log("Confirm");
    var err = req.session.data["error"];
    axios.get('https://www.trade-tariff.service.gov.uk/api/v2/commodities/' + req.params["goods_nomenclature_item_id"])
        .then((response) => {
            c = new Commodity();
            c.pass_request(req);
            c.phase = "confirm";
            c.get_data(response.data);
            c.get_measure_data(req.session.data["origin"]);
            res.render('calculate/08_confirm', { 'commodity': c, 'error': err });
        });
});

// Calculator - Results
router.get('/calculate/results/:goods_nomenclature_item_id', function (req, res) {
    var err = req.session.data["error"];
    axios.get('https://www.trade-tariff.service.gov.uk/api/v2/commodities/' + req.params["goods_nomenclature_item_id"])
        .then((response) => {
            c = new Commodity();
            c.pass_request(req);
            c.phase = "results";
            c.get_data(response.data);
            c.get_exchange_rate();
            c.get_measure_data(req.session.data["origin"]);
            res.render('calculate/09_results', { 'commodity': c, 'error': err });
        });
});

module.exports = router
