export class BookingRepository {
    constructor(dao){
        this.dao= dao
    }

    getAll () {
        return this.dao.getAll();
    }

    getById (id) {
        return this.dao.getById(id);
    }

    findByServiceDateAndTime (serviceId,date,time) {
        return this.dao.findByServiceDateAndTime (serviceId,date,time);
    }

    update(id, data) {
        return this.dao.update(id,data)
    }

    delete(id) {
        return this.dao.delete(id)
    }

    create(data) {
        return this.dao.create(data);
    }

    findByDateAndTime(date, time) {
        return this.dao.findByDateAndTime(date, time);
    }
}

