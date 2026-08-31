-- One-time backfill: gives every existing News post a baseline view
-- count, normally distributed (mean 550, stddev 150) and clamped to
-- [100, 1000], so organic views (via ViewTracker.js) add on top of a
-- realistic-looking starting point rather than everything showing 0.
--
-- NOT a schema migration - a one-off data seed. Safe to run once; the
-- guard below ("where not exists") skips any post that already has at
-- least one view row, so accidentally running this twice won't double
-- every count. Generated from the live Prismic News list at the time
-- this was written - a post added after this runs just starts at 0 and
-- accrues organic views normally, same as before this backfill existed.

insert into news_post_views (post_uid, visitor_id)
select 'drones--order-or-revolution', gen_random_uuid()::text
from generate_series(1, 806)
where not exists (select 1 from news_post_views where post_uid = 'drones--order-or-revolution');

insert into news_post_views (post_uid, visitor_id)
select 'blackbeard-low-cost-hypersonic-missile-testing-on-', gen_random_uuid()::text
from generate_series(1, 550)
where not exists (select 1 from news_post_views where post_uid = 'blackbeard-low-cost-hypersonic-missile-testing-on-');

insert into news_post_views (post_uid, visitor_id)
select 'south-korea-launches-next-generation-fighter-progr', gen_random_uuid()::text
from generate_series(1, 448)
where not exists (select 1 from news_post_views where post_uid = 'south-korea-launches-next-generation-fighter-progr');

insert into news_post_views (post_uid, visitor_id)
select 'massive-expansion-at-chinas-area-51', gen_random_uuid()::text
from generate_series(1, 608)
where not exists (select 1 from news_post_views where post_uid = 'massive-expansion-at-chinas-area-51');

insert into news_post_views (post_uid, visitor_id)
select 'spain-clears-6.3bn-joint-airbus-tanker-deal-with-p', gen_random_uuid()::text
from generate_series(1, 411)
where not exists (select 1 from news_post_views where post_uid = 'spain-clears-6.3bn-joint-airbus-tanker-deal-with-p');

insert into news_post_views (post_uid, visitor_id)
select 'france-is-not-ready-to-face-cheap-drones-yet-warns', gen_random_uuid()::text
from generate_series(1, 410)
where not exists (select 1 from news_post_views where post_uid = 'france-is-not-ready-to-face-cheap-drones-yet-warns');

insert into news_post_views (post_uid, visitor_id)
select 'regent-secures-240-million-series-b-funding-to-sca', gen_random_uuid()::text
from generate_series(1, 784)
where not exists (select 1 from news_post_views where post_uid = 'regent-secures-240-million-series-b-funding-to-sca');

insert into news_post_views (post_uid, visitor_id)
select 'marine-engineering-centre-planned-for-uks-clyde-dr', gen_random_uuid()::text
from generate_series(1, 466)
where not exists (select 1 from news_post_views where post_uid = 'marine-engineering-centre-planned-for-uks-clyde-dr');

insert into news_post_views (post_uid, visitor_id)
select 'what-europe-needs-next-in-beyond-visual-range-air-', gen_random_uuid()::text
from generate_series(1, 641)
where not exists (select 1 from news_post_views where post_uid = 'what-europe-needs-next-in-beyond-visual-range-air-');

insert into news_post_views (post_uid, visitor_id)
select 'pentagon-awards-11-million-contract-to-x-bow-systemsin-race-to-field-cheaper-interceptors-missiles', gen_random_uuid()::text
from generate_series(1, 516)
where not exists (select 1 from news_post_views where post_uid = 'pentagon-awards-11-million-contract-to-x-bow-systemsin-race-to-field-cheaper-interceptors-missiles');

insert into news_post_views (post_uid, visitor_id)
select 'u.s.-army-orders-99-million-worth-of-drone-detecti', gen_random_uuid()::text
from generate_series(1, 695)
where not exists (select 1 from news_post_views where post_uid = 'u.s.-army-orders-99-million-worth-of-drone-detecti');

insert into news_post_views (post_uid, visitor_id)
select 'ukrainian-drone-maker-lands-10.4-million-funding-r', gen_random_uuid()::text
from generate_series(1, 602)
where not exists (select 1 from news_post_views where post_uid = 'ukrainian-drone-maker-lands-10.4-million-funding-r');

insert into news_post_views (post_uid, visitor_id)
select 'uk-aerospace-rd-returns-14-for-every-1-invested-sa', gen_random_uuid()::text
from generate_series(1, 659)
where not exists (select 1 from news_post_views where post_uid = 'uk-aerospace-rd-returns-14-for-every-1-invested-sa');

insert into news_post_views (post_uid, visitor_id)
select 'critical-raw-materials-and-european-defence', gen_random_uuid()::text
from generate_series(1, 736)
where not exists (select 1 from news_post_views where post_uid = 'critical-raw-materials-and-european-defence');

insert into news_post_views (post_uid, visitor_id)
select 'leave-europe-to-the-europeans-the-case-for-a-u.s.-', gen_random_uuid()::text
from generate_series(1, 362)
where not exists (select 1 from news_post_views where post_uid = 'leave-europe-to-the-europeans-the-case-for-a-u.s.-');

insert into news_post_views (post_uid, visitor_id)
select 'koreas-k9-howitzer-enters-western-europe-with-spai', gen_random_uuid()::text
from generate_series(1, 610)
where not exists (select 1 from news_post_views where post_uid = 'koreas-k9-howitzer-enters-western-europe-with-spai');

insert into news_post_views (post_uid, visitor_id)
select 'u.s.-navy-awards-contract-for-zone-5s-combat-prove', gen_random_uuid()::text
from generate_series(1, 781)
where not exists (select 1 from news_post_views where post_uid = 'u.s.-navy-awards-contract-for-zone-5s-combat-prove');

insert into news_post_views (post_uid, visitor_id)
select 'with-ai-hackers-in-mind-u.s.-air-forces-cyber-deve', gen_random_uuid()::text
from generate_series(1, 651)
where not exists (select 1 from news_post_views where post_uid = 'with-ai-hackers-in-mind-u.s.-air-forces-cyber-deve');

insert into news_post_views (post_uid, visitor_id)
select 'uk-soldiers-could-get-paragliders-to-drop-behind-e', gen_random_uuid()::text
from generate_series(1, 458)
where not exists (select 1 from news_post_views where post_uid = 'uk-soldiers-could-get-paragliders-to-drop-behind-e');

insert into news_post_views (post_uid, visitor_id)
select 'f-35-block-4-upgrade-and-future-role', gen_random_uuid()::text
from generate_series(1, 452)
where not exists (select 1 from news_post_views where post_uid = 'f-35-block-4-upgrade-and-future-role');

insert into news_post_views (post_uid, visitor_id)
select 'u.s.-military-uses-av-directed-energy-system-to-de', gen_random_uuid()::text
from generate_series(1, 360)
where not exists (select 1 from news_post_views where post_uid = 'u.s.-military-uses-av-directed-energy-system-to-de');

insert into news_post_views (post_uid, visitor_id)
select 'hms-bulwark-to-transfer-to-brazilian-navy-as-uk-tu', gen_random_uuid()::text
from generate_series(1, 624)
where not exists (select 1 from news_post_views where post_uid = 'hms-bulwark-to-transfer-to-brazilian-navy-as-uk-tu');

insert into news_post_views (post_uid, visitor_id)
select 'air-force-immediately-stops-use-of-minuteman-iii-c', gen_random_uuid()::text
from generate_series(1, 613)
where not exists (select 1 from news_post_views where post_uid = 'air-force-immediately-stops-use-of-minuteman-iii-c');

insert into news_post_views (post_uid, visitor_id)
select 'u.s.-navy-awards-castelion-90m-to-advance-blackbea', gen_random_uuid()::text
from generate_series(1, 711)
where not exists (select 1 from news_post_views where post_uid = 'u.s.-navy-awards-castelion-90m-to-advance-blackbea');

insert into news_post_views (post_uid, visitor_id)
select 'mystery-military-vehicle-spotted-in-japan-sparks-o', gen_random_uuid()::text
from generate_series(1, 284)
where not exists (select 1 from news_post_views where post_uid = 'mystery-military-vehicle-spotted-in-japan-sparks-o');

insert into news_post_views (post_uid, visitor_id)
select 'lockheed-martin-completes-second-successful-jr3-ro', gen_random_uuid()::text
from generate_series(1, 376)
where not exists (select 1 from news_post_views where post_uid = 'lockheed-martin-completes-second-successful-jr3-ro');

insert into news_post_views (post_uid, visitor_id)
select 'india-turns-to-private-sector-to-ramp-up-missile-p', gen_random_uuid()::text
from generate_series(1, 623)
where not exists (select 1 from news_post_views where post_uid = 'india-turns-to-private-sector-to-ramp-up-missile-p');

insert into news_post_views (post_uid, visitor_id)
select 'japan-indonesia-and-australia-defense-chiefs-hold-', gen_random_uuid()::text
from generate_series(1, 397)
where not exists (select 1 from news_post_views where post_uid = 'japan-indonesia-and-australia-defense-chiefs-hold-');

insert into news_post_views (post_uid, visitor_id)
select 'canada-ready-to-further-distance-itself-from-u.s.-', gen_random_uuid()::text
from generate_series(1, 561)
where not exists (select 1 from news_post_views where post_uid = 'canada-ready-to-further-distance-itself-from-u.s.-');

insert into news_post_views (post_uid, visitor_id)
select 'us-southern-border-task-force-deploys-high-energy-', gen_random_uuid()::text
from generate_series(1, 680)
where not exists (select 1 from news_post_views where post_uid = 'us-southern-border-task-force-deploys-high-energy-');

insert into news_post_views (post_uid, visitor_id)
select 'amping-up-air-power-poland-set-to-receive-five-mor', gen_random_uuid()::text
from generate_series(1, 251)
where not exists (select 1 from news_post_views where post_uid = 'amping-up-air-power-poland-set-to-receive-five-mor');

insert into news_post_views (post_uid, visitor_id)
select 'royal-navy-wargamed-its-hybrid-fleet-and-still-needs-crewed-warships-says-first-sea-lord', gen_random_uuid()::text
from generate_series(1, 770)
where not exists (select 1 from news_post_views where post_uid = 'royal-navy-wargamed-its-hybrid-fleet-and-still-needs-crewed-warships-says-first-sea-lord');

insert into news_post_views (post_uid, visitor_id)
select 'taiwan-signs-nt26.9-billion-deal-for-more-than-200', gen_random_uuid()::text
from generate_series(1, 302)
where not exists (select 1 from news_post_views where post_uid = 'taiwan-signs-nt26.9-billion-deal-for-more-than-200');

insert into news_post_views (post_uid, visitor_id)
select 'bundeswehr-expands-schakal-fleet-for-natos-eastern', gen_random_uuid()::text
from generate_series(1, 588)
where not exists (select 1 from news_post_views where post_uid = 'bundeswehr-expands-schakal-fleet-for-natos-eastern');

insert into news_post_views (post_uid, visitor_id)
select 'swedens-navy-chief-with-frigates-we-are-securing-t', gen_random_uuid()::text
from generate_series(1, 308)
where not exists (select 1 from news_post_views where post_uid = 'swedens-navy-chief-with-frigates-we-are-securing-t');

insert into news_post_views (post_uid, visitor_id)
select 'u.s.-navy-wants-new-standoff-aerial-torpedo-for-ca', gen_random_uuid()::text
from generate_series(1, 603)
where not exists (select 1 from news_post_views where post_uid = 'u.s.-navy-wants-new-standoff-aerial-torpedo-for-ca');

insert into news_post_views (post_uid, visitor_id)
select 'finland-and-sweden-team-up-to-boost-counter-drone-', gen_random_uuid()::text
from generate_series(1, 494)
where not exists (select 1 from news_post_views where post_uid = 'finland-and-sweden-team-up-to-boost-counter-drone-');

insert into news_post_views (post_uid, visitor_id)
select 'taiwan-bound-harpoon-coastal-defense-system-scores', gen_random_uuid()::text
from generate_series(1, 672)
where not exists (select 1 from news_post_views where post_uid = 'taiwan-bound-harpoon-coastal-defense-system-scores');

insert into news_post_views (post_uid, visitor_id)
select 'germany-in-talks-to-help-fund-uks-trident-nuclear-programme', gen_random_uuid()::text
from generate_series(1, 695)
where not exists (select 1 from news_post_views where post_uid = 'germany-in-talks-to-help-fund-uks-trident-nuclear-programme');

insert into news_post_views (post_uid, visitor_id)
select 'japan-approves-mass-production-of-3d-printed-inter', gen_random_uuid()::text
from generate_series(1, 568)
where not exists (select 1 from news_post_views where post_uid = 'japan-approves-mass-production-of-3d-printed-inter');

insert into news_post_views (post_uid, visitor_id)
select 'us-patriot-missile-stocks-in-europe-are-beyond-cri', gen_random_uuid()::text
from generate_series(1, 308)
where not exists (select 1 from news_post_views where post_uid = 'us-patriot-missile-stocks-in-europe-are-beyond-cri');

insert into news_post_views (post_uid, visitor_id)
select 'u.s.-army-reaches-agreement-with-private-industry-for-nuclear-micro-reactors', gen_random_uuid()::text
from generate_series(1, 534)
where not exists (select 1 from news_post_views where post_uid = 'u.s.-army-reaches-agreement-with-private-industry-for-nuclear-micro-reactors');

insert into news_post_views (post_uid, visitor_id)
select 'hms-swiftsure-drydocked-in-rosyth-for-recycling', gen_random_uuid()::text
from generate_series(1, 264)
where not exists (select 1 from news_post_views where post_uid = 'hms-swiftsure-drydocked-in-rosyth-for-recycling');

insert into news_post_views (post_uid, visitor_id)
select 'new-chancellor-john-healey-to-shelve-his-own-defen', gen_random_uuid()::text
from generate_series(1, 727)
where not exists (select 1 from news_post_views where post_uid = 'new-chancellor-john-healey-to-shelve-his-own-defen');

insert into news_post_views (post_uid, visitor_id)
select 'navantia-uk-expands-methil-yard-in-fife-for-defenc', gen_random_uuid()::text
from generate_series(1, 466)
where not exists (select 1 from news_post_views where post_uid = 'navantia-uk-expands-methil-yard-in-fife-for-defenc');

insert into news_post_views (post_uid, visitor_id)
select 'nato-surveillance-drone-flies-25-hour-mission', gen_random_uuid()::text
from generate_series(1, 240)
where not exists (select 1 from news_post_views where post_uid = 'nato-surveillance-drone-flies-25-hour-mission');

insert into news_post_views (post_uid, visitor_id)
select 'royal-navy-to-study-extending-type-45-destroyers-s', gen_random_uuid()::text
from generate_series(1, 680)
where not exists (select 1 from news_post_views where post_uid = 'royal-navy-to-study-extending-type-45-destroyers-s');

insert into news_post_views (post_uid, visitor_id)
select 'france-takes-nato-naval-command-from-uk', gen_random_uuid()::text
from generate_series(1, 458)
where not exists (select 1 from news_post_views where post_uid = 'france-takes-nato-naval-command-from-uk');

insert into news_post_views (post_uid, visitor_id)
select 'navy-advances-mh-60-modernization-identifies-indus', gen_random_uuid()::text
from generate_series(1, 932)
where not exists (select 1 from news_post_views where post_uid = 'navy-advances-mh-60-modernization-identifies-indus');

insert into news_post_views (post_uid, visitor_id)
select 'hanwha-wins-us-army-mobile-tactical-cannon-contrac', gen_random_uuid()::text
from generate_series(1, 568)
where not exists (select 1 from news_post_views where post_uid = 'hanwha-wins-us-army-mobile-tactical-cannon-contrac');

insert into news_post_views (post_uid, visitor_id)
select 'uk-targets-fleet-of-up-to-12-nuclear-powered-attac', gen_random_uuid()::text
from generate_series(1, 428)
where not exists (select 1 from news_post_views where post_uid = 'uk-targets-fleet-of-up-to-12-nuclear-powered-attac');

insert into news_post_views (post_uid, visitor_id)
select 'australia-lays-keel-for-first-hunter-class-anti-su', gen_random_uuid()::text
from generate_series(1, 498)
where not exists (select 1 from news_post_views where post_uid = 'australia-lays-keel-for-first-hunter-class-anti-su');

insert into news_post_views (post_uid, visitor_id)
select 'uks-msi-wins-contract-for-naval-gun-systems-with-u', gen_random_uuid()::text
from generate_series(1, 380)
where not exists (select 1 from news_post_views where post_uid = 'uks-msi-wins-contract-for-naval-gun-systems-with-u');

insert into news_post_views (post_uid, visitor_id)
select 'for-the-first-time-chinese-j-16s-go-head-to-head-w', gen_random_uuid()::text
from generate_series(1, 505)
where not exists (select 1 from news_post_views where post_uid = 'for-the-first-time-chinese-j-16s-go-head-to-head-w');

insert into news_post_views (post_uid, visitor_id)
select 'the-overstretch-facing-the-us-navy', gen_random_uuid()::text
from generate_series(1, 528)
where not exists (select 1 from news_post_views where post_uid = 'the-overstretch-facing-the-us-navy');

insert into news_post_views (post_uid, visitor_id)
select 'china-develops-missile-to-target-planes-thousands-', gen_random_uuid()::text
from generate_series(1, 512)
where not exists (select 1 from news_post_views where post_uid = 'china-develops-missile-to-target-planes-thousands-');

insert into news_post_views (post_uid, visitor_id)
select 'china-cannot-yet-hold-a-beach-on-taiwan', gen_random_uuid()::text
from generate_series(1, 597)
where not exists (select 1 from news_post_views where post_uid = 'china-cannot-yet-hold-a-beach-on-taiwan');

insert into news_post_views (post_uid, visitor_id)
select 'edge-and-the-brazilian-army-to-establish-first-of-its-kind-cyber-defence-centre-of-excellence-in-latin-america', gen_random_uuid()::text
from generate_series(1, 756)
where not exists (select 1 from news_post_views where post_uid = 'edge-and-the-brazilian-army-to-establish-first-of-its-kind-cyber-defence-centre-of-excellence-in-latin-america');

insert into news_post_views (post_uid, visitor_id)
select 'royal-netherlands-navy-opts-for-destinus-hornet-b2', gen_random_uuid()::text
from generate_series(1, 654)
where not exists (select 1 from news_post_views where post_uid = 'royal-netherlands-navy-opts-for-destinus-hornet-b2');

insert into news_post_views (post_uid, visitor_id)
select 'a-south-philadelphia-startup-is-making-underwater-military-drones-in-a-former-kitchen-countertop-showroom', gen_random_uuid()::text
from generate_series(1, 488)
where not exists (select 1 from news_post_views where post_uid = 'a-south-philadelphia-startup-is-making-underwater-military-drones-in-a-former-kitchen-countertop-showroom');

insert into news_post_views (post_uid, visitor_id)
select 'latvia-arms-its-new-combat-vehicle-against-drone-t', gen_random_uuid()::text
from generate_series(1, 724)
where not exists (select 1 from news_post_views where post_uid = 'latvia-arms-its-new-combat-vehicle-against-drone-t');

insert into news_post_views (post_uid, visitor_id)
select 'tiny-air-to-air-missile-in-development-for-stealth', gen_random_uuid()::text
from generate_series(1, 428)
where not exists (select 1 from news_post_views where post_uid = 'tiny-air-to-air-missile-in-development-for-stealth');

insert into news_post_views (post_uid, visitor_id)
select 'nato-seeks-a-next-generation-multi-role-helicopter', gen_random_uuid()::text
from generate_series(1, 1000)
where not exists (select 1 from news_post_views where post_uid = 'nato-seeks-a-next-generation-multi-role-helicopter');

insert into news_post_views (post_uid, visitor_id)
select 'bradley-fighting-vehicle-lugging-load-of-swarming-', gen_random_uuid()::text
from generate_series(1, 509)
where not exists (select 1 from news_post_views where post_uid = 'bradley-fighting-vehicle-lugging-load-of-swarming-');

insert into news_post_views (post_uid, visitor_id)
select 'httpswww.indragroup.comennewsindra-equips-tanks-wi', gen_random_uuid()::text
from generate_series(1, 503)
where not exists (select 1 from news_post_views where post_uid = 'httpswww.indragroup.comennewsindra-equips-tanks-wi');

insert into news_post_views (post_uid, visitor_id)
select 'mq-9b-aewc-the-worlds-first-unmanned-airborne-earl', gen_random_uuid()::text
from generate_series(1, 595)
where not exists (select 1 from news_post_views where post_uid = 'mq-9b-aewc-the-worlds-first-unmanned-airborne-earl');

insert into news_post_views (post_uid, visitor_id)
select 'britain-expands-nuclear-submarine-production-for-d', gen_random_uuid()::text
from generate_series(1, 501)
where not exists (select 1 from news_post_views where post_uid = 'britain-expands-nuclear-submarine-production-for-d');

insert into news_post_views (post_uid, visitor_id)
select 'hmnb-devonport-overhaul-prepares-base-for-uks-type', gen_random_uuid()::text
from generate_series(1, 684)
where not exists (select 1 from news_post_views where post_uid = 'hmnb-devonport-overhaul-prepares-base-for-uks-type');

insert into news_post_views (post_uid, visitor_id)
select 'new-partnership-set-to-see-the-uk-and-ukraine-deve', gen_random_uuid()::text
from generate_series(1, 440)
where not exists (select 1 from news_post_views where post_uid = 'new-partnership-set-to-see-the-uk-and-ukraine-deve');

insert into news_post_views (post_uid, visitor_id)
select 'taiwan-charges-nine-people-for-smuggling-high-end-', gen_random_uuid()::text
from generate_series(1, 830)
where not exists (select 1 from news_post_views where post_uid = 'taiwan-charges-nine-people-for-smuggling-high-end-');

insert into news_post_views (post_uid, visitor_id)
select 'the-mystery-of-j-20-fighter-like-shapes-spotted-in', gen_random_uuid()::text
from generate_series(1, 523)
where not exists (select 1 from news_post_views where post_uid = 'the-mystery-of-j-20-fighter-like-shapes-spotted-in');

insert into news_post_views (post_uid, visitor_id)
select 't-7a-red-hawk-third-delivery-to-joint-base-san-antonio', gen_random_uuid()::text
from generate_series(1, 100)
where not exists (select 1 from news_post_views where post_uid = 't-7a-red-hawk-third-delivery-to-joint-base-san-antonio');

insert into news_post_views (post_uid, visitor_id)
select 'taiwan-reveals-strong-bow-hypersonic-missile-detai', gen_random_uuid()::text
from generate_series(1, 768)
where not exists (select 1 from news_post_views where post_uid = 'taiwan-reveals-strong-bow-hypersonic-missile-detai');

insert into news_post_views (post_uid, visitor_id)
select 'colombian-armed-groups-gamify-drone-warfare-to-tra', gen_random_uuid()::text
from generate_series(1, 596)
where not exists (select 1 from news_post_views where post_uid = 'colombian-armed-groups-gamify-drone-warfare-to-tra');

insert into news_post_views (post_uid, visitor_id)
select 'european-allies-team-up-to-buy-polish-portable-ant', gen_random_uuid()::text
from generate_series(1, 383)
where not exists (select 1 from news_post_views where post_uid = 'european-allies-team-up-to-buy-polish-portable-ant');

insert into news_post_views (post_uid, visitor_id)
select 'fiasco-in-the-factory-taxpayers-funded-a-533-milli', gen_random_uuid()::text
from generate_series(1, 549)
where not exists (select 1 from news_post_views where post_uid = 'fiasco-in-the-factory-taxpayers-funded-a-533-milli');

insert into news_post_views (post_uid, visitor_id)
select 'betting-on-autonomous-aircraft', gen_random_uuid()::text
from generate_series(1, 647)
where not exists (select 1 from news_post_views where post_uid = 'betting-on-autonomous-aircraft');

insert into news_post_views (post_uid, visitor_id)
select 'rusi-questions-core-principle-of-uk-targeting-proj', gen_random_uuid()::text
from generate_series(1, 375)
where not exists (select 1 from news_post_views where post_uid = 'rusi-questions-core-principle-of-uk-targeting-proj');

insert into news_post_views (post_uid, visitor_id)
select 'saab-shows-off-loyal-wingman-drone-it-hopes-to-off', gen_random_uuid()::text
from generate_series(1, 719)
where not exists (select 1 from news_post_views where post_uid = 'saab-shows-off-loyal-wingman-drone-it-hopes-to-off');

insert into news_post_views (post_uid, visitor_id)
select 'poland-receives-first-korean-k2-tanks-from-new-6.5', gen_random_uuid()::text
from generate_series(1, 596)
where not exists (select 1 from news_post_views where post_uid = 'poland-receives-first-korean-k2-tanks-from-new-6.5');

insert into news_post_views (post_uid, visitor_id)
select 'britain-clears-storm-shadow-missile-assembly-in-ukraine', gen_random_uuid()::text
from generate_series(1, 678)
where not exists (select 1 from news_post_views where post_uid = 'britain-clears-storm-shadow-missile-assembly-in-ukraine');

insert into news_post_views (post_uid, visitor_id)
select 'putin-adviser-raises-attacks-on-british-drone-fact', gen_random_uuid()::text
from generate_series(1, 469)
where not exists (select 1 from news_post_views where post_uid = 'putin-adviser-raises-attacks-on-british-drone-fact');

insert into news_post_views (post_uid, visitor_id)
select 'italy-eyes-us-tech-for-souping-up-dumb-missiles-in', gen_random_uuid()::text
from generate_series(1, 531)
where not exists (select 1 from news_post_views where post_uid = 'italy-eyes-us-tech-for-souping-up-dumb-missiles-in');

insert into news_post_views (post_uid, visitor_id)
select 'u.s.-marine-corps-order-19-million-in-hellfire-armed-buggies-built-to-fire-and-vanish', gen_random_uuid()::text
from generate_series(1, 278)
where not exists (select 1 from news_post_views where post_uid = 'u.s.-marine-corps-order-19-million-in-hellfire-armed-buggies-built-to-fire-and-vanish');

insert into news_post_views (post_uid, visitor_id)
select 'real-underwater-world-events-underline-rn-atlantic', gen_random_uuid()::text
from generate_series(1, 623)
where not exists (select 1 from news_post_views where post_uid = 'real-underwater-world-events-underline-rn-atlantic');

insert into news_post_views (post_uid, visitor_id)
select 'the-risks-of-downplaying-chinas-military', gen_random_uuid()::text
from generate_series(1, 404)
where not exists (select 1 from news_post_views where post_uid = 'the-risks-of-downplaying-chinas-military');

insert into news_post_views (post_uid, visitor_id)
select 'hybrid-navy-building-the-maritime-operating-system', gen_random_uuid()::text
from generate_series(1, 453)
where not exists (select 1 from news_post_views where post_uid = 'hybrid-navy-building-the-maritime-operating-system');

insert into news_post_views (post_uid, visitor_id)
select 'uk-german-strike-programme-includes-hypersonic-wea', gen_random_uuid()::text
from generate_series(1, 206)
where not exists (select 1 from news_post_views where post_uid = 'uk-german-strike-programme-includes-hypersonic-wea');

insert into news_post_views (post_uid, visitor_id)
select 'uk-mod-interest-could-see-vertical-aerospaces-hybrid-defence-aircraft-in-service-before-valo', gen_random_uuid()::text
from generate_series(1, 381)
where not exists (select 1 from news_post_views where post_uid = 'uk-mod-interest-could-see-vertical-aerospaces-hybrid-defence-aircraft-in-service-before-valo');

insert into news_post_views (post_uid, visitor_id)
select 'chinas-reusable-space-launch-booster-recoveries-ha', gen_random_uuid()::text
from generate_series(1, 763)
where not exists (select 1 from news_post_views where post_uid = 'chinas-reusable-space-launch-booster-recoveries-ha');

insert into news_post_views (post_uid, visitor_id)
select 'swedish-army-to-get-recon-strike-drones-in-37m-dea', gen_random_uuid()::text
from generate_series(1, 608)
where not exists (select 1 from news_post_views where post_uid = 'swedish-army-to-get-recon-strike-drones-in-37m-dea');

insert into news_post_views (post_uid, visitor_id)
select 'babcock-strengthens-uk-danish-naval-partnerships', gen_random_uuid()::text
from generate_series(1, 541)
where not exists (select 1 from news_post_views where post_uid = 'babcock-strengthens-uk-danish-naval-partnerships');

insert into news_post_views (post_uid, visitor_id)
select 'on-independence-day-eu-adds-7b-for-ukraine', gen_random_uuid()::text
from generate_series(1, 623)
where not exists (select 1 from news_post_views where post_uid = 'on-independence-day-eu-adds-7b-for-ukraine');

insert into news_post_views (post_uid, visitor_id)
select 'nextech-solutions-buys-boomslang-in-latest-counter', gen_random_uuid()::text
from generate_series(1, 314)
where not exists (select 1 from news_post_views where post_uid = 'nextech-solutions-buys-boomslang-in-latest-counter');

insert into news_post_views (post_uid, visitor_id)
select 'koreas-hd-hyundai-pursues-u.s.-shipyard-acquisition', gen_random_uuid()::text
from generate_series(1, 566)
where not exists (select 1 from news_post_views where post_uid = 'koreas-hd-hyundai-pursues-u.s.-shipyard-acquisition');

insert into news_post_views (post_uid, visitor_id)
select 'attritable-is-not-a-price-point', gen_random_uuid()::text
from generate_series(1, 533)
where not exists (select 1 from news_post_views where post_uid = 'attritable-is-not-a-price-point');

insert into news_post_views (post_uid, visitor_id)
select 'saab-unveils-a3-001-collaborative-combat-aircraft-', gen_random_uuid()::text
from generate_series(1, 599)
where not exists (select 1 from news_post_views where post_uid = 'saab-unveils-a3-001-collaborative-combat-aircraft-');

insert into news_post_views (post_uid, visitor_id)
select 'army-cyber-defenses-need-dedicated-funding-for-ai-', gen_random_uuid()::text
from generate_series(1, 508)
where not exists (select 1 from news_post_views where post_uid = 'army-cyber-defenses-need-dedicated-funding-for-ai-');

insert into news_post_views (post_uid, visitor_id)
select 'british-spy-plane-deploys-to-norway-for-arctic-sto', gen_random_uuid()::text
from generate_series(1, 559)
where not exists (select 1 from news_post_views where post_uid = 'british-spy-plane-deploys-to-norway-for-arctic-sto');

insert into news_post_views (post_uid, visitor_id)
select 'lockheed-found-a-way-to-cut-a-pac-3-mse-missiles-price-in-halfbut-it-comes-with-a-major-catch', gen_random_uuid()::text
from generate_series(1, 598)
where not exists (select 1 from news_post_views where post_uid = 'lockheed-found-a-way-to-cut-a-pac-3-mse-missiles-price-in-halfbut-it-comes-with-a-major-catch');

insert into news_post_views (post_uid, visitor_id)
select 'israel-eyes-potential-boeing-f-47-acquisition', gen_random_uuid()::text
from generate_series(1, 344)
where not exists (select 1 from news_post_views where post_uid = 'israel-eyes-potential-boeing-f-47-acquisition');

insert into news_post_views (post_uid, visitor_id)
select 'finlands-patria-partners-with-ukraines-general-che', gen_random_uuid()::text
from generate_series(1, 505)
where not exists (select 1 from news_post_views where post_uid = 'finlands-patria-partners-with-ukraines-general-che');

insert into news_post_views (post_uid, visitor_id)
select 'saab-reveals-concept-of-future-unmanned-fighter-je', gen_random_uuid()::text
from generate_series(1, 448)
where not exists (select 1 from news_post_views where post_uid = 'saab-reveals-concept-of-future-unmanned-fighter-je');

-- 103 posts seeded, 55651 synthetic view rows total (avg 540 per post).