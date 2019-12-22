import {templates, select} from '../settings.js';
import {utils} from '../utils.js';
import {AmountWidget} from './AmountWidget.js';
import {DatePicker} from './DatePicker.js';
import {HourPicker} from './HourPicker.js';
import {settings, classNames} from '../settings.js';

export class Booking {
    constructor(wrapperBooking) {
        const thisBooking = this;

        thisBooking.render(wrapperBooking);
        thisBooking.initWidgets();
        thisBooking.getData();
    }

    render(element) {
        const thisBooking = this;

        const generateHTML = templates.bookingWidget();
        thisBooking.dom = {};
        thisBooking.dom.wrapper = element;
        thisBooking.dom.wrapper = utils.createDOMFromHTML(generateHTML);
        element.appendChild(thisBooking.dom.wrapper);

        thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
        thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
        thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
        thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
        thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    }

    initWidgets() {
        const thisBooking = this;

        thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
        thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
        thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
        thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

        thisBooking.dom.wrapper.addEventListener('updated', function() {
            thisBooking.updateDOM();
        });
    }

    getData() {
        const thisBooking = this;

        const startEndDates = {};
        startEndDates[settings.db.dateStartParamKey] = utils.dateToStr(thisBooking.datePicker.minDate);
        startEndDates[settings.db.dateEndParamKey] = utils.dateToStr(thisBooking.datePicker.maxDate);

        const endDate = {};
        endDate[settings.db.dateEndParamKey] = startEndDates[settings.db.dateEndParamKey];

        const params = {
            booking: utils.queryParams(startEndDates),
            eventsCurrent: settings.db.notRepeatParam + '&' + utils.queryParams(startEndDates),
            eventsRepeat: settings.db.repeatParam + '&' + utils.queryParams(endDate),
        };

        // console.log('getData params', params);

        const urls = {
            booking: settings.db.url + '/' + settings.db.booking + '?' + params.booking,
            eventsCurrent: settings.db.url + '/' + settings.db.event + '?' + params.eventsCurrent,
            eventsRepeat: settings.db.url + '/' + settings.db.event + '?' + params.eventsRepeat,
        };

        // console.log('getData urls', urls);

        Promise.all([
            fetch(urls.booking),
            fetch(urls.eventsCurrent),
            fetch(urls.eventsRepeat),
        ])
            .then(function([bookingsResponse, eventsCurrentResponse, eventsRepeatResponse]){
                return Promise.all([
                    bookingsResponse.json(),
                    eventsCurrentResponse.json(),
                    eventsRepeatResponse.json(),
                ]);
            })
            .then(function([bookings, eventsCurrent, eventsRepeat]){
                thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
            });
    }

    parseData(bookings, eventsCurrent, eventsRepeat) {
        const thisBooking = this;
        thisBooking.booked = {};

        for(let booking of bookings) {
            thisBooking.makeBooked(booking.date, booking.hour, booking.duration, booking.table);
        }

        for(let eventCurrent of eventsCurrent) {
            thisBooking.makeBooked(eventCurrent.date, eventCurrent.hour, eventCurrent.duration, eventCurrent.table);
        }

        for(let eventRepeat of eventsRepeat){
            for(let rangeDate = thisBooking.datePicker.minDate; rangeDate <= thisBooking.datePicker.maxDate; rangeDate = utils.addDays(rangeDate, 1)) {
                thisBooking.makeBooked(utils.dateToStr(rangeDate), eventRepeat.hour, eventRepeat.duration, eventRepeat.table);
            }
        }
        thisBooking.updateDOM();
    }

    makeBooked(date, hour, duration, table) {
        const thisBooking = this;
        const startHour = utils.hourToNumber(hour);

        if(typeof thisBooking.booked[date] == 'undefined') {
            thisBooking.booked[date] = {};
        }

        for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5 ){
            if(typeof thisBooking.booked[date][hourBlock] == 'undefined') {
                thisBooking.booked[date][hourBlock] = [];
            }
            thisBooking.booked[date][hourBlock].push(table);
        }
    }

    updateDOM() {
        const thisBooking = this;

        thisBooking.date = thisBooking.datePicker.value;
        thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);
        
        for(let table of thisBooking.dom.tables){
            let tableId = table.getAttribute(settings.booking.tableIdAttribute);
            if(!isNaN(tableId)) {
                tableId = parseInt(tableId);
            }
            if(thisBooking.booked[thisBooking.date] && thisBooking.booked[thisBooking.date][thisBooking.hour] && thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)) {
                table.classList.add(classNames.booking.tableBooked);
            } else {
                table.classList.remove(classNames.booking.tableBooked);
            }
        }
    }
}
