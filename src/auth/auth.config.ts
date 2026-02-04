import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthConfig {
  public userPoolId = process.env.COGNITO_POOL_ID;
  public region = process.env.COGNITO_POOL_REGION;
  public authority = `https://cognito-idp.${this.region}.amazonaws.com/${this.userPoolId}`;
}
