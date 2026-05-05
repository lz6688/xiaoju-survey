import 'reflect-metadata';

import { SURVEY_PERMISSION } from 'src/enums/surveyPermission';
import { ChannelController } from 'src/modules/channel/controllers/channel.controller';
import { CollaboratorController } from '../controllers/collaborator.controller';
import { SessionController } from '../controllers/session.controller';
import { SurveyController } from '../controllers/survey.controller';
import { SurveyHistoryController } from '../controllers/surveyHistory.controller';
import { SurveyMetaController } from '../controllers/surveyMeta.controller';

describe('route permission metadata', () => {
  it('uses edit permission for survey editing routes', () => {
    expect(
      Reflect.getMetadata('surveyPermission', SurveyController.prototype.createSurvey),
    ).toEqual([SURVEY_PERMISSION.SURVEY_EDIT_MANAGE]);
    expect(
      Reflect.getMetadata('surveyPermission', SurveyController.prototype.updateConf),
    ).toEqual([SURVEY_PERMISSION.SURVEY_EDIT_MANAGE]);
    expect(
      Reflect.getMetadata('surveyPermission', SurveyController.prototype.publishSurvey),
    ).toEqual([SURVEY_PERMISSION.SURVEY_DELIVERY_MANAGE]);
    expect(
      Reflect.getMetadata('surveyPermission', SurveyMetaController.prototype.updateMeta),
    ).toEqual([SURVEY_PERMISSION.SURVEY_EDIT_MANAGE]);
    expect(
      Reflect.getMetadata('surveyPermission', SessionController.prototype.create),
    ).toEqual([SURVEY_PERMISSION.SURVEY_EDIT_MANAGE]);
    expect(
      Reflect.getMetadata('surveyPermission', SessionController.prototype.seize),
    ).toEqual([SURVEY_PERMISSION.SURVEY_EDIT_MANAGE]);
  });

  it('uses delivery permission for delivery routes', () => {
    expect(
      Reflect.getMetadata('surveyPermission', SurveyController.prototype.pausingSurvey),
    ).toEqual([SURVEY_PERMISSION.SURVEY_DELIVERY_MANAGE]);
    expect(
      Reflect.getMetadata('surveyPermission', ChannelController.prototype.create),
    ).toEqual([SURVEY_PERMISSION.SURVEY_DELIVERY_MANAGE]);
    expect(
      Reflect.getMetadata('surveyPermission', ChannelController.prototype.findAll),
    ).toEqual([SURVEY_PERMISSION.SURVEY_DELIVERY_MANAGE]);
    expect(
      Reflect.getMetadata('surveyPermission', ChannelController.prototype.update),
    ).toEqual([SURVEY_PERMISSION.SURVEY_DELIVERY_MANAGE]);
    expect(
      Reflect.getMetadata('surveyPermission', ChannelController.prototype.updateStatus),
    ).toEqual([SURVEY_PERMISSION.SURVEY_DELIVERY_MANAGE]);
    expect(
      Reflect.getMetadata('surveyPermission', ChannelController.prototype.delete),
    ).toEqual([SURVEY_PERMISSION.SURVEY_DELIVERY_MANAGE]);
  });

  it('uses authorization permission for collaborator routes', () => {
    expect(
      Reflect.getMetadata('surveyPermission', CollaboratorController.prototype.addCollaborator),
    ).toEqual([SURVEY_PERMISSION.SURVEY_AUTH_MANAGE]);
    expect(
      Reflect.getMetadata('surveyPermission', CollaboratorController.prototype.batchSaveCollaborator),
    ).toEqual([SURVEY_PERMISSION.SURVEY_AUTH_MANAGE]);
    expect(
      Reflect.getMetadata('surveyPermission', CollaboratorController.prototype.getSurveyCollaboratorList),
    ).toEqual([SURVEY_PERMISSION.SURVEY_AUTH_MANAGE]);
    expect(
      Reflect.getMetadata('surveyPermission', CollaboratorController.prototype.changeUserPermission),
    ).toEqual([SURVEY_PERMISSION.SURVEY_AUTH_MANAGE]);
    expect(
      Reflect.getMetadata('surveyPermission', CollaboratorController.prototype.deleteCollaborator),
    ).toEqual([SURVEY_PERMISSION.SURVEY_AUTH_MANAGE]);
  });

  it('uses view permissions for readonly survey routes', () => {
    expect(
      Reflect.getMetadata('surveyPermission', SurveyController.prototype.getSurvey),
    ).toEqual([
      SURVEY_PERMISSION.SURVEY_EDIT_MANAGE,
      SURVEY_PERMISSION.SURVEY_DELIVERY_MANAGE,
      SURVEY_PERMISSION.SURVEY_AUTH_MANAGE,
      SURVEY_PERMISSION.SURVEY_RESPONSE_MANAGE,
    ]);
    expect(
      Reflect.getMetadata('surveyPermission', SurveyHistoryController.prototype.getList),
    ).toEqual([
      SURVEY_PERMISSION.SURVEY_EDIT_MANAGE,
      SURVEY_PERMISSION.SURVEY_DELIVERY_MANAGE,
      SURVEY_PERMISSION.SURVEY_AUTH_MANAGE,
      SURVEY_PERMISSION.SURVEY_RESPONSE_MANAGE,
    ]);
  });
});
