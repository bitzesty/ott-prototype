var nomar = require("nomar");
var showdown = require('showdown');
var _ = require('underscore');

module.exports = function (env) {
    
    /**
     * Instantiate object used to store the methods registered as a
     * 'filter' (of the same name) within nunjucks. You can override
     * gov.uk core filters by creating filter methods of the same name.
     * @type {Object}
     */
    var filters = {}

    /* ------------------------------------------------------------------
      add your methods to the filters obj below this comment block:
      @example:
  
      filters.sayHi = function(name) {
          return 'Hi ' + name + '!'
      }
  
      Which in your templates would be used as:
  
      {{ 'Paul' | sayHi }} => 'Hi Paul'
  
      Notice the first argument of your filters method is whatever
      gets 'piped' via '|' to the filter.
  
      Filters can take additional arguments, for example:
  
      filters.sayHi = function(name,tone) {
        return (tone == 'formal' ? 'Greetings' : 'Hi') + ' ' + name + '!'
      }
  
      Which would be used like this:
  
      {{ 'Joel' | sayHi('formal') }} => 'Greetings Joel!'
      {{ 'Gemma' | sayHi }} => 'Hi Gemma!'
  
      For more on filters and how to write them see the Nunjucks
      documentation.
  
    ------------------------------------------------------------------ */

    filters.substring = function (str, start, lngth) {
        if (typeof str !== 'undefined') {
            return str.substr(start, lngth);
        } else {
            return "";
        }
    }

    filters.format_commodity_code = function (str) {
        if (typeof str !== 'undefined') {
            s = str.substr(0, 4) + ".";
            s += str.substr(4, 2) + ".";
            s += str.substr(6, 2) + ".";
            s += str.substr(8, 2) ;
            return s;
        } else {
            return "";
        }
    }

    filters.roman = function (str) {
        if (typeof str !== 'undefined') {
            return nomar(parseInt(str));
        } else {
            return "";
        }
    }

    filters.showdown = function (str) {
        if (typeof str !== 'undefined') {
            converter = new showdown.Converter();
            converter.setOption("backslashEscapesHTMLTags", true)
            text = converter.makeHtml(str);
            text = text.replace("&lt;", "<"); 
            text = text.replace("&gt;", ">");
            return text;
        } else {
            return "";
        }
    }
    /* ------------------------------------------------------------------
      keep the following line to return your filters to the app
    ------------------------------------------------------------------ */
    return filters
}
