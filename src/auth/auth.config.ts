import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthConfig {
  public userPoolId = process.env.CLIENTBOOK_COGNITO_POOL_ID;
  public region = process.env.CLIENTBOOK_COGNITO_POOL_REGION;
  public authority = `https://cognito-idp.${this.region}.amazonaws.com/${this.userPoolId}`;
}
