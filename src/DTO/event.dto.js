export class EventDTO {
    constructor(event) {
        this.id = event._id.toString();
        this.title = event.title;
        this.description = event.description;
        this.category = event.category;

        this.capacity = event.sectors.reduce(
            (total, sector) => total + sector.capacity,
            0
        );

        this.price = Math.min(
            ...event.sectors.map(sector => sector.price)
        );

        this.date = event.date;
        this.location = event.location;
        this.sectors = event.sectors;
        this.artists = event.artists;
        this.genre = event.genre;
        this.ageRestriction = event.ageRestriction;
        this.image = event.image;
        this.status = event.status;
        this.organizer = event.organizer;
    }
}