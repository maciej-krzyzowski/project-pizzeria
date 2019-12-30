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
        thisBooking.peopleAmountInput = thisBooking.dom.peopleAmount.querySelector(select.widgets.amount.input);
        thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
        thisBooking.hoursAmountInput = thisBooking.dom.hoursAmount.querySelector(select.widgets.amount.input);
        thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
        thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
        thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
        thisBooking.dom.submitBookTable = thisBooking.dom.wrapper.querySelector(select.booking.submit);
        thisBooking.checkbox = thisBooking.dom.wrapper.querySelector('.checkbox');
        thisBooking.dom.inputPhone = thisBooking.dom.wrapper.querySelector(select.cart.phone);
        thisBooking.dom.inputAddress = thisBooking.dom.wrapper.querySelector(select.cart.address);
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

        thisBooking.dom.submitBookTable.addEventListener('click', function(event){
            event.preventDefault();
            thisBooking.sendBooked();
            alert('Reservation accepted!');
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

        const urls = {
            booking: settings.db.url + '/' + settings.db.booking + '?' + params.booking,
            eventsCurrent: settings.db.url + '/' + settings.db.event + '?' + params.eventsCurrent,
            eventsRepeat: settings.db.url + '/' + settings.db.event + '?' + params.eventsRepeat,
        };

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

    sendBooked() {
        const thisBooking = this;

        const url = settings.db.url + '/' + settings.db.booking;
        const payload = {
            id: thisBooking.lastId + 1,
            date: thisBooking.date,
            hour: thisBooking.hourPicker.value,
            table: thisBooking.bookedTableId,
            duration: thisBooking.hoursAmountInput.value,
            people: thisBooking.peopleAmountInput.value,
            phone: thisBooking.dom.inputPhone.value,
            address: thisBooking.dom.inputAddress.value,
            repeat: false,
        };

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        };

        fetch(url, options)
            .then(function(response) {
                return response.json();
            });
    }

    parseData(bookings, eventsCurrent, eventsRepeat) {
        const thisBooking = this;
        thisBooking.booked = {};

        if (bookings.length) thisBooking.lastId = bookings[bookings.length - 1].id;
        else thisBooking.lastId = 0;

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
        thisBooking.rangeSliderColor();
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

            const isReserved = thisBooking.booked[thisBooking.date] && thisBooking.booked[thisBooking.date][thisBooking.hour] && thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId);

            if(isReserved) {
                table.classList.add(classNames.booking.tableBooked);
            } else {
                table.classList.remove(classNames.booking.tableBooked);
            }
            
            table.addEventListener('click', function(){
                if(!isReserved) {
                    table.classList.toggle(classNames.booking.tableBooked);
                    thisBooking.bookedTableId = tableId;
                }
            });
        }

    }

    rangeSliderColor() {
        const thisBooking = this;
      
        const bookedHours = thisBooking.booked[thisBooking.date];
        const sliderDataColors = [];
        const rangeSlider = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.slider);
      
        for (let bookedHour in bookedHours){
            const firstOfInterval = 0;
            const secondOfInterval = (((bookedHour - 12) + .5 ) * 100) / 12;
            if ( bookedHour < 24 ) {
                if
                (bookedHours[bookedHour].length <=1) {
                    sliderDataColors.push ('/*' + bookedHour + '*/green ' + firstOfInterval + '%, green ' + secondOfInterval + '%');
                } else if
                (bookedHours[bookedHour].length == 2) {
                    sliderDataColors.push ('/*' + bookedHour + '*/orange ' + firstOfInterval + '%, orange ' + secondOfInterval + '% ');
                } else if
                (bookedHours[bookedHour].length >= 3){
                    sliderDataColors.push ('/*' + bookedHour + '*/red ' + firstOfInterval + '%, red ' + secondOfInterval + '%');
                }
            }
        }
        sliderDataColors.sort();
        rangeSlider.style.background = 'linear-gradient(to right, ' + sliderDataColors + ')';
    }
}
