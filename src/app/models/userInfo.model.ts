export class UserInfo {
  constructor(private name?: string, private email?: string) {}

  public get userInfo() {
    return { name: this.name, email: this.email };
  }

  public set userInfo(info) {
    this.name = info.name;
    this.email = info.email;
  }
}
