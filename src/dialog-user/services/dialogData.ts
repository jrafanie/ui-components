import * as _ from 'lodash';
import * as angular from 'angular';
import {__} from '../../common/translateFunction';

export default class DialogDataService {

  /**
   * Sets up and configures properties for a dialog field
   * @memberof DialogDataService
   * @function setupField
   * @param data {any} This is a object that is all the information for a particular dialog field
   *
   **/
  public setupField(data: any) {
    let field = _.cloneDeep(data);
    const dropDownValues = [];
    field.fieldBeingRefreshed = (angular.isDefined(field.fieldBeingRefreshed) ? field.fieldBeingRefreshed : false);
    if (angular.isUndefined(field.fieldValidation)) {
      field.fieldValidation = '';
      field.errorMessage = '';
    }
    const sortableFieldTypes = ['DialogFieldDropDownList', 'DialogFieldRadioButton'];
    if (_.includes(sortableFieldTypes,field.type)) {
      for (let option of field.values) {
        if (option[0] === String(field.default_value)) {
          field.selected = option;
        }
        const value = ((field.data_type === 'integer' && option[0] !== null) ? parseInt(option[0], 10) : option[0]);
        const description = (isNaN(option[1]) ? option[1] : parseInt(option[1], 10));
        dropDownValues.push([value, description]);
      }
      field.values = dropDownValues;
      field.values = this.updateFieldSortOrder(field);
    }
    field.default_value = this.setDefaultValue(field);

    return field;
  }

  /**
   *
   * This method updates sort order of dialog options for a dialog field that is a drop down.
   * @memberof DialogDataService
   * @function updateFieldSortOrder
   * @param data {any} This is a object that is all the information for a particular dialog field
   *
   **/
  private updateFieldSortOrder(data) {
    const SORT_DESCRIPTION = 1;
    const SORT_VALUE = 0;
    const FIRST_OPTION = 0;
    const VALUE = 0;
    const sortBy = (data.options.sort_by === 'value' ? SORT_VALUE : SORT_DESCRIPTION);
    let tempValues = [...data.values];
    let defaultDropdownField = [];
    // The following if deals with a empty default option if it exists
    if (data.data_type === 'integer' && _.isNaN(tempValues[FIRST_OPTION][VALUE]) ||
      _.isNull(tempValues[FIRST_OPTION][VALUE])) {
      defaultDropdownField = tempValues.shift();
    }
    let values = _.sortBy(tempValues, sortBy);
    const sortedValues = data.options.sort_order === 'ascending' ? values : values.reverse();
    if (defaultDropdownField.length) {
      sortedValues.unshift(defaultDropdownField);
    }

    return sortedValues;
  }

  /**
   *
   * This method sets default value for a dialog field
   * @memberof DialogDataService
   * @function setDefaultValue
   * @param data {any} This is a object that is all the information for a particular dialog field
   *
   **/
  private setDefaultValue(data): any {
    let defaultValue: any = '';
    const firstOption = 0; // these are meant to help make code more readable
    const fieldValue = 0;
    if (_.isObject(data.values)) {
      if (angular.isDefined(data.default_value) && data.default_value !== null) {
        defaultValue = data.default_value;
      } else {
        defaultValue = data.values[firstOption][fieldValue];
      }
    } else {
      if (data.type === 'DialogFieldDateControl' || data.type === 'DialogFieldDateTimeControl') {
        if (data.values === undefined) {
          defaultValue = new Date();
        } else {
          defaultValue = new Date(data.values);
        }
      } else {
        defaultValue = data.values;
      }
    }
    if (data.default_value) {
      defaultValue = data.default_value;
    }

    return defaultValue;
  }

  /**
   *
   * Validates a dialog field to ensure that the values supplied meet required criteria
   * @memberof DialogDataService
   * @function validateField
   * @param field {any} This is a object that is all the information for a particular dialog field
   * @param value {any} Field is optional.  Allows you to explicitly pass in the value to verify for a field
   **/
  public validateField(field, value): any {
    const fieldValue = (value ? value : field.default_value);
    const validation = {
      isValid: true,
      field: '',
      message: ''
    };
    validation.field = field.label;

    if (field.required) {
      if (field.type === 'DialogFieldCheckBox' && fieldValue === 'f') {
        validation.isValid = false;
        validation.message = __('This field is required');
      } else if (field.type === 'DialogFieldTagControl') {
        if (this.isInvalidTagControl(field.options.force_single_value, fieldValue)) {
          validation.isValid = false;
          validation.message = __('This field is required');
        }
      } else if (_.isEmpty(fieldValue)) {
        validation.isValid = false;
        validation.message = __('This field is required');
      }
    }
    // Run check if someone has specified a regex.  Make sure if its required it is not blank
    if (field.validator_rule && validation.isValid === true) {
      if (angular.isDefined(fieldValue) && fieldValue !== '') {
        // This use case ensures that an optional field doesnt check a regex if field is blank
        const regexPattern = field.validator_rule.replace(/\\A/i, '^').replace(/\\Z/i,'$');
        const regex = new RegExp(regexPattern);
        const regexValidates = regex.test(fieldValue);
        validation.isValid = regexValidates;
        validation.message = __('Entered text does not match required format.');
      }
    }

    return validation;
  }

  /**
   * Determines if a value is a tag control and whether or not that value is valid
   * @memberof DialogDataService
   * @function isInvalidTagControl
   * @param forceSingleValue {boolean} Whether or not the field allows multiple selections
   * @param fieldValue {any} This is the value of the field in question to be validated
   **/
  private isInvalidTagControl(forceSingleValue, fieldValue) {
    let invalid = false;

    if (forceSingleValue) {
      if (_.isNumber(fieldValue)) {
        if (fieldValue === 0) {
          invalid = true;
        }
      } else if (_.isEmpty(fieldValue)) {
        invalid = true;
      }
    } else {
      if (_.isEmpty(fieldValue)) {
        invalid = true;
      }
    }

    return invalid;
  }
}
