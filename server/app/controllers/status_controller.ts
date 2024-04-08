export default class StatusController {
  async index() {
    return {
      name: 'Mini Play Party Server',
      status: 'ok',
    }
  }
}
