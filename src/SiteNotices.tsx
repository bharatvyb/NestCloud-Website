import {usePublicSettings} from './usePublicSettings';
import {existingContactUrl} from './enquiry';
import {sitePath} from './site';
import './site-notices.css';

/** Plain-text notices only. Maintenance leaves all contact/support pages accessible. */
export function SiteNotices() {
 const settings=usePublicSettings();
 return <>{settings?.banner.enabled&&<aside className="site-notice" aria-label="NestCloud announcement"><div className="container">{settings.banner.message}{settings.banner.link&&<> <a href={settings.banner.link} rel="noreferrer">Learn more</a></>}</div></aside>}
 {settings?.maintenance.enabled&&<aside className="site-notice site-maintenance" role="status" aria-label="Website maintenance"><div className="container"><p>{settings.maintenance.message}</p><p><a href={sitePath('/contact')}>Contact us</a> · <a href={sitePath('/support#contact')}>Technical Support</a> · <a href={existingContactUrl}>Existing device support</a></p></div></aside>}</>;
}
