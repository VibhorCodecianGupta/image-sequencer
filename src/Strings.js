module.exports = function(steps, modulesInfo, addSteps, copy) {
  // Genates a CLI string for the current sequence
  function toCliString() {
    var cliStringSteps = `"`, cliOptions = {};
    for (var step in steps) {
      if (steps[step].options.name !== "load-image")
        cliStringSteps += `${steps[step].options.name} `;
      for (var inp in modulesInfo(steps[step].options.name).inputs) {
        cliOptions[inp] = steps[step].options[inp];
      }
    }
    cliStringSteps = cliStringSteps.substr(0, cliStringSteps.length - 1) + `"`;
    return `sequencer -i [PATH] -s ${cliStringSteps} -d '${JSON.stringify(cliOptions)}'`
  }

  // Strigifies the current sequence
  function toString(step) {
    if (step) {
      return stepToString(step);
    } else {
      return copy(this.images.image1.steps).map(stepToString).slice(1).join(',');
    }
  }

  // Stringifies one step of the sequence
  function stepToString(step) {
    let inputs = modulesInfo(step.options.name).inputs || {}, op = {};

    for (let input in inputs) {

      if (!!step.options[input] && step.options[input] != inputs[input].default) {
        op[input] = step.options[input];
        op[input] = encodeURIComponent(op[input]);
      }

    }

    var configurations = Object.keys(op).map(key => key + ':' + op[key]).join('|');
    return `${step.options.name}{${configurations}}`;
  }

  // exports the current sequence as an array of JSON steps
  function toJSON() {
    return stringToJSON(toString());
  }

  // Coverts stringified sequence into an array of JSON steps
  function stringToJSON(str) {
    let steps;
    if (str.includes(','))
      steps = str.split(',');
    else
      steps = [str];
    return steps.map(stringToJSONstep);
  }

  // Converts one stringified step into JSON
  function stringToJSONstep(str) {
    var bracesStrings;
    if (str.includes('{'))
      if (str.includes('(') && str.indexOf('(') < str.indexOf('{'))
        bracesStrings = ['(', ')'];
      else
        bracesStrings = ['{', '}'];
    else
      bracesStrings = ['(', ')'];

    if (str.indexOf(bracesStrings[0]) === -1) { // if there are no settings specified
      var moduleName = str.substr(0);
      stepSettings = "";
    } else {
      var moduleName = str.substr(0, str.indexOf(bracesStrings[0]));
      stepSettings = str.slice(str.indexOf(bracesStrings[0]) + 1, -1);
    }

    stepSettings = stepSettings.split('|').reduce(function formatSettings(accumulator, current, i) {
      var settingName = current.substr(0, current.indexOf(':')),
        settingValue = current.substr(current.indexOf(':') + 1);
      settingValue = settingValue.replace(/^\(/, '').replace(/\)$/, ''); // strip () at start/end
      settingValue = settingValue.replace(/^\{/, '').replace(/\}$/, ''); // strip {} at start/end
      settingValue = decodeURIComponent(settingValue);
      current = [
        settingName,
        settingValue
      ];
      if (!!settingName) accumulator[settingName] = settingValue;
      return accumulator;
    }, {});

    return {
      name: moduleName,
      options: stepSettings
    }
  }

  // imports a string into the sequencer steps
  function importString(str) {
    let sequencer = this;
    if (this.name != "ImageSequencer")
      sequencer = this.sequencer;
    var stepsFromString = stringToJSON(str);
    stepsFromString.forEach(function eachStep(stepObj) {
      sequencer.addSteps(stepObj.name, stepObj.options);
    });
  }

  // imports a array of JSON steps into the sequencer steps
  function importJSON(obj) {
    let sequencer = this;
    if (this.name != "ImageSequencer")
      sequencer = this.sequencer;
    obj.forEach(function eachStep(stepObj) {
      sequencer.addSteps(stepObj.name, stepObj.options);
    });
  }

  return {
    toCliString: toCliString,
    toString: toString,
    stepToString: stepToString,
    toJSON: toJSON,
    stringToJSON: stringToJSON,
    stringToJSONstep: stringToJSONstep,
    importString: importString,
    importJSON: importJSON
  }
}