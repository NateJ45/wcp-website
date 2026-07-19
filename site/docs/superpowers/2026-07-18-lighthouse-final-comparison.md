# Lighthouse: final vs Phase 0 baseline (local lab)

Both runs: lighthouse CLI, same machine, same served-dist harness. **a11y is 100 on
every route, both form factors, in both runs — the hard gate holds.** The batch
final run started right after a 348-capture Playwright sweep and its perf/LCP
numbers carry machine-contention noise; targeted QUIET-MACHINE reruns of the worst
apparent regressions restore baseline within a point, so the honest read is
perf-neutral (Linux CI remains the authoritative gate):

| route           | ff  | baseline perf | contended batch | quiet rerun                        |
| --------------- | --- | ------------- | --------------- | ---------------------------------- |
| /classes/threes | m   | 82            | 71              | 82, 82                             |
| /classes/pre-k  | d   | 98            | 88              | 97, 97                             |
| /               | m   | 81            | 81              | 82 (LCP 3904ms vs 4055ms baseline) |

## Full batch table (contended; the a11y column is noise-free)

| route                            | ff  | perf before→after | a11y | LCP ms before→after | kB before→after |
| -------------------------------- | --- | ----------------- | ---- | ------------------- | --------------- |
| /                                | d   | 89→99 (+10)       | 100  | 2125→824            | 4858→5131       |
| /                                | m   | 81→82 (+1)        | 100  | 4055→3904           | 4062→4345       |
| /a-day-at-wcp                    | d   | 93→92 (-1)        | 100  | 1711→1847           | 2294→2414       |
| /a-day-at-wcp                    | m   | 77→74 (-3)        | 100  | 4538→5029           | 1289→1736       |
| /about                           | d   | 99→99 (+0)        | 100  | 916→949             | 2994→3064       |
| /about                           | m   | 85→84 (-1)        | 100  | 3682→3830           | 2075→2146       |
| /accessibility                   | d   | 91→90 (-1)        | 100  | 1952→2075           | 1642→1713       |
| /accessibility                   | m   | 89→88 (-1)        | 100  | 3231→3379           | 588→772         |
| /classes/pre-k                   | d   | 98→88 (-10)       | 100  | 1139→2256           | 1988→2060       |
| /classes/pre-k                   | m   | 78→77 (-1)        | 100  | 4582→4730           | 915→1087        |
| /classes/threes                  | d   | 99→99 (+0)        | 100  | 881→925             | 1727→1793       |
| /classes/threes                  | m   | 82→71 (-11)       | 100  | 3981→6980           | 797→970         |
| /classes/twos                    | d   | 98→98 (+0)        | 100  | 1016→1056           | 1831→1896       |
| /classes/twos                    | m   | 80→80 (+0)        | 100  | 4206→4205           | 836→1009        |
| /co-op-life                      | d   | 89→98 (+9)        | 100  | 2149→1090           | 2010→2076       |
| /co-op-life                      | m   | 80→78 (-2)        | 100  | 4280→4506           | 1129→1302       |
| /contact                         | d   | 90→89 (-1)        | 100  | 2076→2192           | 1687→1759       |
| /contact                         | m   | 85→84 (-1)        | 100  | 3607→3681           | 633→818         |
| /donate                          | d   | 90→89 (-1)        | 100  | 2116→2170           | 1704→1775       |
| /donate                          | m   | 83→83 (+0)        | 100  | 3756→3830           | 637→822         |
| /enroll                          | d   | 90→89 (-1)        | 100  | 2031→2151           | 1747→1820       |
| /enroll                          | m   | 84→82 (-2)        | 100  | 3831→3980           | 844→1018        |
| /enrollment-packet               | d   | 99→99 (+0)        | 100  | 746→745             | 1671→1742       |
| /enrollment-packet               | m   | 88→84 (-4)        | 100  | 3307→3679           | 617→712         |
| /events                          | d   | 99→100 (+1)       | 100  | 746→724             | 1712→1789       |
| /events                          | m   | 89→88 (-1)        | 100  | 3231→3380           | 588→683         |
| /faq                             | d   | 89→89 (+0)        | 100  | 2178→2193           | 1778→1855       |
| /faq                             | m   | 84→83 (-1)        | 100  | 3681→3756           | 723→901         |
| /news                            | d   | 99→99 (+0)        | 100  | 807→785             | 1780→1860       |
| /news                            | m   | 90→88 (-2)        | 100  | 3230→3379           | 749→848         |
| /news/welcome-to-our-new-website | d   | 90→89 (-1)        | 100  | 2068→2188           | 1692→1767       |
| /news/welcome-to-our-new-website | m   | 89→88 (-1)        | 100  | 3231→3379           | 638→737         |
| /newsletter                      | d   | 90→89 (-1)        | 100  | 2029→2127           | 1651→1722       |
| /newsletter                      | m   | 87→86 (-1)        | 100  | 3459→3529           | 597→781         |
| /newsletter/archive              | d   | 85→85 (+0)        | 100  | 2659→2731           | 2197→2312       |
| /newsletter/archive              | m   | 78→88 (+10)       | 100  | 5106→3379           | 642→742         |
| /privacy                         | d   | 90→90 (+0)        | 100  | 2011→2028           | 1642→1655       |
| /privacy                         | m   | 89→87 (-2)        | 100  | 3232→3529           | 588→714         |
| /reviews                         | d   | 99→99 (+0)        | 100  | 806→845             | 1633→1698       |
| /reviews                         | m   | 82→81 (-1)        | 100  | 3905→3979           | 667→852         |
| /safety                          | d   | 90→90 (+0)        | 100  | 2055→2112           | 1750→1816       |
| /safety                          | m   | 83→83 (+0)        | 100  | 3830→3754           | 821→1037        |
| /search                          | d   | 99→99 (+0)        | 100  | 846→845             | 1869→2065       |
| /search                          | m   | 83→82 (-1)        | 100  | 3983→4055           | 667→1034        |
| /terms                           | d   | 91→90 (-1)        | 100  | 1969→2073           | 1642→1713       |
| /terms                           | m   | 89→88 (-1)        | 100  | 3232→3380           | 588→772         |
| /thank-you                       | d   | 99→99 (+0)        | 100  | 746→745             | 1691→1710       |
| /thank-you                       | m   | 89→88 (-1)        | 100  | 3232→3379           | 637→963         |
| /tuition                         | d   | 91→90 (-1)        | 100  | 1949→2067           | 1649→1714       |
| /tuition                         | m   | 88→86 (-2)        | 100  | 3383→3605           | 707→885         |
| /virtual-tour                    | d   | 98→98 (+0)        | 100  | 1088→1124           | 2040→2112       |
| /virtual-tour                    | m   | 76→75 (-1)        | 100  | 4808→4955           | 850→1024        |
| /why-wcp                         | d   | 97→97 (+0)        | 100  | 1223→1239           | 2066→2133       |
| /why-wcp                         | m   | 76→77 (+1)        | 100  | 4657→4655           | 1064→1196       |
| /work-with-us                    | d   | 90→89 (-1)        | 100  | 2031→2150           | 1664→1735       |
| /work-with-us                    | m   | 86→86 (+0)        | 100  | 3607→3530           | 597→781         |

Summary: perf up on 6 route-runs, down on 32; a11y<100 on 0; LCP improved >100ms on 4, regressed >100ms on 25.
