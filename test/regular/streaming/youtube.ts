import { focusChild, skipCheckingErrorsInLog, test, useSpectron } from '../../helpers/spectron';
import { logIn } from '../../helpers/spectron/user';
import {
  chatIsVisible,
  clickGoLive,
  goLive,
  prepareToGoLive,
  scheduleStream, stopStream,
  submit,
  waitForStreamStart
} from '../../helpers/spectron/streaming';
import { FormMonkey, selectTitle } from '../../helpers/form-monkey';
import moment = require('moment');
import { sleep } from '../../helpers/sleep';

useSpectron();

test('Streaming to Youtube', async t => {
  await logIn(t, 'youtube');

  t.false(await chatIsVisible(t), 'Chat is not visible for YT before stream starts');

  await goLive(t, {
    title: 'SLOBS Test Stream',
    description: 'SLOBS Test Stream Description',
  });

  t.true(await chatIsVisible(t), 'Chat should be visible');

  // give youtube 2 min to publish stream
  await focusChild(t);
  await t.context.app.client.waitForVisible("h1=You're live!", 2 * 60 * 1000);

  t.pass();
});

test('Streaming to the scheduled event on Youtube', async t => {
  await logIn(t, 'youtube', { multistream: false });

  // create event via scheduling form
  const tomorrow = Date.now() + 1000 * 60 * 60 * 24;
  const formattedTomorrow = moment(tomorrow).format(moment.localeData().longDateFormat('ll'));
  await scheduleStream(t, tomorrow, {
    title: 'Youtube Test Stream',
    description: 'SLOBS Test Stream Description',
  });

  // select event and go live
  await prepareToGoLive(t);
  await clickGoLive(t);
  const form = new FormMonkey(t);
  await form.fill({
    event: await form.getOptionByTitle('event', `Youtube Test Stream (${formattedTomorrow})`),
  });
  await submit(t);
  await waitForStreamStart(t);
  t.pass();
});

test('Start stream twice to the same YT event', async t => {
  await logIn(t, 'youtube', { multistream: false });

  // create event via scheduling form
  const now = Date.now();
  await goLive(t, {
    title: `Youtube Test Stream ${now}`,
    description: 'SLOBS Test Stream Description',
    enableAutoStop: false,
  });
  await stopStream(t);

  await goLive(t, {
    event: selectTitle(`Youtube Test Stream ${now}`),
    enableAutoStop: true,
  });
  t.pass();
});

test('Youtube streaming is disabled', async t => {
  skipCheckingErrorsInLog();
  await logIn(t, 'youtube', { streamingIsDisabled: true, notStreamable: true });
  t.true(
    await t.context.app.client.isExisting('span=YouTube account not enabled for live streaming'),
    'The streaming-disabled message should be visible',
  );
});
