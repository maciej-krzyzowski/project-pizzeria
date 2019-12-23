import {BaseWidget} from './BaseWidget.js';
import {utils} from '../utils.js';
import {select} from '../settings.js';

export class DatePicker extends BaseWidget {
    constructor(wrapper) {
        super(wrapper, utils.dateToStr(new Date()));

        const thisWidget = this;

        thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.datePicker.input);
        thisWidget.initPlugin();
    }

    initPlugin() {
        const thisWidget = this;

        thisWidget.minDate = new Date(thisWidget.value);

        thisWidget.maxDate = utils.addDays(thisWidget.minDate, 14);
        
        thisWidget.dom.input.addEventListener('input', function(){
            thisWidget.value = thisWidget.dom.input.value;
        });

        flatpickr(thisWidget.dom.input, { // eslint-disable-line
            enableTime: false,
            dateFormat: 'Y-m-d',
            defalutDate: 'today',
            minDate: 'today',
            maxDate: thisWidget.maxDate,
            disable: [
                function(date) {
                    return (date.getDay() == 1);
                }
            ],
            locale: {
                firstDayOfWeek: 1,
            },
        });
    }

    parseValue(argument) {
        return argument;
    }

    isValid() {
        return true;
    }

    renderValue(){
    }
}
