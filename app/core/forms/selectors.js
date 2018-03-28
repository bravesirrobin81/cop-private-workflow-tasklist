import { NAME } from './constants';

export const form = state => state[NAME].get('form');
export const isFetchingForm = state => state[NAME].get('isFetchingForm');
export const formLoadingFailed = state => state[NAME].get('formLoadingFailed');