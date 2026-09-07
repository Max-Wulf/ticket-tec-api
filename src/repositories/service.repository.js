export class servicesRepository {
  constructor(dao) {
    this.dao = dao;
  }

  getAll(options = {}) {
    return this.dao.getAll(options);
  }

  getById(id) {
    return this.dao.getById(id);
  }

  create(data) {
    return this.dao.create(data);
  }

  update(id, data) {
    return this.dao.update(id, data);
  }

  delete(id) {
    return this.dao.delete(id);
  }

  getByPrice(price) {
    return this.dao.getByPrice(price);
  }

}