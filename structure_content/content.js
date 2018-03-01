let content = {
  //
  newAppointment : {
    type     : "vertical",
    elements : [{
      type    : "text",
      text    : "Dentist Appointment",
      tooltip : "Create new appointment",
      style   : {
        bold  : true,
        size  : "large",
        color : "#000"
      }
    }, {
      type  : "button",
      title : "Create new appointment",
      click : {
        metadata : [{
          "type" : "ExternalId",
          "id"   : "12345678"
        }],
        actions  : [{
          "type" : "publishText",
          "text" : "day"
        }]
      },
      style : {
        bold  : false,
        size  : "medium",
        color : "#0A0A0"
      }
    }]
  },
  day            : {
    type     : "vertical",
    elements : [{
      type    : "text",
      text    : "Select Day",
      tooltip : "Create new appointment",
      style   : {
        bold  : true,
        size  : "large",
        color : "#000"
      }
    }, {
      type  : "button",
      title : "Monday",
      click : {
        metadata : [{
          "type" : "ExternalId",
          "id"   : "12345678"
        }],
        actions  : [{
          "type" : "publishText",
          "text" : "Monday"
        }]
      },
      style : {
        bold  : false,
        size  : "medium",
        color : "#0A0A0"
      }
    }, {
      type  : "button",
      title : "Tuesday",
      click : {
        metadata : [{
          "type" : "ExternalId",
          "id"   : "12345678"
        }],
        actions  : [{
          "type" : "publishText",
          "text" : "Tuesday"
        }]
      },
      style : {
        bold  : false,
        size  : "medium",
        color : "#0A0A0"
      }
    }, {
      type  : "button",
      title : "Wednesday",
      click : {
        metadata : [{
          "type" : "ExternalId",
          "id"   : "12345678"
        }],
        actions  : [{
          "type" : "publishText",
          "text" : "Wednesday"
        }]
      },
      style : {
        bold  : false,
        size  : "medium",
        color : "#0A0A0"
      }
    }, {
      type  : "button",
      title : "Thursday",
      click : {
        metadata : [{
          "type" : "ExternalId",
          "id"   : "12345678"
        }],
        actions  : [{
          "type" : "publishText",
          "text" : "Thursday"
        }]
      },
      style : {
        bold  : false,
        size  : "medium",
        color : "#0A0A0"
      }
    }, {
      type  : "button",
      title : "Friday",
      click : {
        metadata : [{
          "type" : "ExternalId",
          "id"   : "12345678"
        }],
        actions  : [{
          "type" : "publishText",
          "text" : "Friday"
        }]
      },
      style : {
        bold  : false,
        size  : "medium",
        color : "#0A0A0"
      }
    }]
  },
  hour           : {
    type     : "vertical",
    elements : [{
      type    : "text",
      text    : "Select Hour",
      tooltip : "Create new appointment",
      style   : {
        bold  : true,
        size  : "large",
        color : "#000"
      }
    }, {
      type  : "button",
      title : "12:00pm",
      click : {
        metadata : [{
          "type" : "ExternalId",
          "id"   : "12345678"
        }],
        actions  : [{
          "type" : "publishText",
          "text" : "12:00pm"
        }]
      },
      style : {
        bold  : false,
        size  : "medium",
        color : "#0A0A0"
      }
    }, {
      type  : "button",
      title : "1:00pm",
      click : {
        metadata : [{
          "type" : "ExternalId",
          "id"   : "12345678"
        }],
        actions  : [{
          "type" : "publishText",
          "text" : "1:00pm"
        }]
      },
      style : {
        bold  : false,
        size  : "medium",
        color : "#0A0A0"
      }
    }, {
      type  : "button",
      title : "2:00pm",
      click : {
        metadata : [{
          "type" : "ExternalId",
          "id"   : "12345678"
        }],
        actions  : [{
          "type" : "publishText",
          "text" : "2:00pm"
        }]
      },
      style : {
        bold  : false,
        size  : "medium",
        color : "#0A0A0"
      }
    }, {
      type  : "button",
      title : "3:00pm",
      click : {
        metadata : [{
          "type" : "ExternalId",
          "id"   : "12345678"
        }],
        actions  : [{
          "type" : "publishText",
          "text" : "3:00pm"
        }]
      },
      style : {
        bold  : false,
        size  : "medium",
        color : "#0A0A0"
      }
    }, {
      type  : "button",
      title : "4:00pm",
      click : {
        metadata : [{
          "type" : "ExternalId",
          "id"   : "12345678"
        }],
        actions  : [{
          "type" : "publishText",
          "text" : "4:00pm"
        }]
      },
      style : {
        bold  : false,
        size  : "medium",
        color : "#0A0A0"
      }
    }]
  },
  simple         : {
    "type"    : "text",
    "text"    : "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis egestas dignissim arcu, quis facilisis augue pharetra quis. Phasellus convallis ullamcorper felis in ultrices. Morbi pharetra at urna ut laoreet. Ut mauris ipsum, imperdiet eu quam at, dignissim malesuada tellus. Mauris in eros tincidunt, ullamcorper enim quis, cursus elit. Nam eu dui sed nisi laoreet aliquam. Sed eget lorem ut neque dapibus placerat. Donec sapien leo, volutpat a quam eget, cursus tincidunt dolor. Sed suscipit, mauris at tincidunt luctus, neque leo mattis est, sed ornare elit felis et libero. Vestibulum blandit luctus quam. Integer et enim eleifend, semper justo vel, feugiat quam. Nullam eu ultrices lectus. Curabitur nibh dui, mattis vel purus sed, viverra interdum ante. Maecenas pellentesque dapibus dui, ac vulputate velit.",
    "tooltip" : "text tooltip"
  },
  complexContent : {
    "type"     : "vertical",
    "elements" : [{
      "type"    : "image",
      "url"     : "https://mobileimages.lowes.com/product/converted/885911/885911334792.jpg",
      "tooltip" : "image tooltip",
    }, {
      "type"     : "horizontal",
      "elements" : [{
        "type"  : "button",
        "title" : "Add to cart",
        "click" : {
          "actions" : [{
            "type" : "publishText",
            "text" : ""
          }]
        }
      }, {
        "type"  : "button",
        "title" : "Add to cart",
        "click" : {
          "actions" : [{
            "type" : "publishText",
            "text" : ""
          }]
        }
      }]
    }, {
      "type"  : "button",
      "title" : "Buy now",
      "click" : {
        "actions" : [{
          "type" : "publishText",
          "text" : ""
        }]
      }
    }]
  }
};
module.exports = content;