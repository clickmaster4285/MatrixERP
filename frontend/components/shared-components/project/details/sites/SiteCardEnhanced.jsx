// // components/shared-components/project/details/sites/SiteCardEnhanced.jsx   
//  i am usin the default site cards directely , 
// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation'; // Add this import
// import {
//    Building,
//    MapPin,
//    User,
//    Phone,
//    Mail,
//    ChevronDown,
//    ChevronUp,
//    Activity,
//    Clock,
//    CheckCircle,
//    AlertCircle,
//    FileText,
//    ExternalLink // Add this icon
// } from 'lucide-react';
// import { format } from 'date-fns';

// import { Card, CardContent } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
// import { Progress } from '@/components/ui/progress';

// const SiteCardEnhanced = ({ site }) => {
//    const [isExpanded, setIsExpanded] = useState(false);
//    const router = useRouter(); // Initialize router

//    const getStatusColor = (status) => {
//       switch (status) {
//          case 'completed': return 'bg-green-500';
//          case 'in-progress': return 'bg-sky-500';
//          case 'planned': return 'bg-amber-500';
//          default: return 'bg-slate-500';
//       }
//    };

//    const getStatusIcon = (status) => {
//       switch (status) {
//          case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
//          case 'in-progress': return <Clock className="h-4 w-4 text-sky-500" />;
//          case 'planned': return <AlertCircle className="h-4 w-4 text-amber-500" />;
//          default: return <AlertCircle className="h-4 w-4 text-slate-400" />;
//       }
//    };

//    const handleViewSite = () => {
//       // Navigate to the site details page
//       router.push(`/admin/sites/${site._id}`);
//    };

//    const totalActivities = site.activityCount || 0;
//    const completedActivities = site.completedActivities || 0;
//    const progress = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;

//    return (
//       <Card className="group hover:shadow-lg transition-all duration-300 hover:border-sky-200 cursor-pointer">
//          <CardContent className="p-6">
//             {/* Header */}
//             <div className="flex items-start justify-between mb-4">
//                <div
//                   className="flex items-start gap-3 flex-1 cursor-pointer"
//                   onClick={handleViewSite} // Make entire header clickable
//                >
//                   <div className="p-3 bg-linear-to-br from-sky-100 to-sky-50 rounded-lg">
//                      <Building className="h-6 w-6 text-sky-600" />
//                   </div>
//                   <div className="flex-1">
//                      <h3 className="font-semibold text-slate-900 group-hover:text-sky-700 transition-colors">
//                         {site.name}
//                      </h3>
//                      <div className="flex items-center gap-2 mt-1">
//                         <Badge variant="outline" className="text-xs">
//                            {site.siteId}
//                         </Badge>
//                         <div className="flex items-center gap-1">
//                            <span className={`w-2 h-2 rounded-full ${getStatusColor(site.overallStatus)}`} />
//                            <span className="text-xs text-slate-600 capitalize">
//                               {site.overallStatus || 'planned'}
//                            </span>
//                         </div>
//                      </div>
//                   </div>
//                </div>
//                <Button
//                   variant="ghost"
//                   size="sm"
//                   onClick={(e) => {
//                      e.stopPropagation(); // Prevent navigation when clicking expand button
//                      setIsExpanded(!isExpanded);
//                   }}
//                   className="h-8 w-8 p-0 hover:bg-sky-50 ml-2"
//                >
//                   {isExpanded ? (
//                      <ChevronUp className="h-4 w-4" />
//                   ) : (
//                      <ChevronDown className="h-4 w-4" />
//                   )}
//                </Button>
//             </div>

//             {/* Location */}
//             {site.primaryLocation?.address && (
//                <div
//                   className="flex items-center gap-2 text-sm text-slate-600 mb-4 cursor-pointer"
//                   onClick={handleViewSite}
//                >
//                   <MapPin className="h-4 w-4 text-slate-400" />
//                   <span className="line-clamp-1 hover:text-sky-600 transition-colors">
//                      {site.primaryLocation.address}
//                   </span>
//                </div>
//             )}

//             {/* Progress Bar */}
//             <div className="space-y-2 mb-4">
//                <div className="flex items-center justify-between text-sm">
//                   <div className="flex items-center gap-2">
//                      <Activity className="h-4 w-4 text-slate-400" />
//                      <span>Site Progress</span>
//                   </div>
//                   <span className="font-semibold text-slate-900">{progress}%</span>
//                </div>
//                <Progress value={progress} className="h-2" />
//                <div className="flex justify-between text-xs text-slate-500">
//                   <span>{completedActivities} completed</span>
//                   <span>{totalActivities - completedActivities} remaining</span>
//                </div>
//             </div>

//             {/* Site Manager */}
//             {site.siteManager && (
//                <div className="flex items-center gap-3 p-3 bg-linear-to-r from-slate-50 to-white rounded-lg mb-4">
//                   <div className="w-8 h-8 rounded-full bg-linear-to-br from-sky-100 to-sky-200 flex items-center justify-center text-sky-700 font-medium text-sm">
//                      {site.siteManager.name?.charAt(0)}
//                   </div>
//                   <div className="flex-1">
//                      <p className="font-medium text-sm text-slate-900">{site.siteManager.name}</p>
//                      <p className="text-xs text-slate-600">Site Manager</p>
//                   </div>
//                </div>
//             )}

//             {/* Expanded Details */}
//             {isExpanded && (
//                <div className="pt-4 border-t border-slate-100 space-y-4">
//                   {/* Activity Summary */}
//                   <div className="space-y-2">
//                      <h4 className="font-semibold text-sm text-slate-900">Activities Summary</h4>
//                      <div className="grid grid-cols-3 gap-2">
//                         <div className="text-center p-2 bg-slate-50 rounded-lg">
//                            <div className="text-lg font-semibold text-slate-900">
//                               {site.activities?.dismantling?.count || 0}
//                            </div>
//                            <div className="text-xs text-slate-600">Dismantling</div>
//                         </div>
//                         <div className="text-center p-2 bg-slate-50 rounded-lg">
//                            <div className="text-lg font-semibold text-slate-900">
//                               {site.activities?.cow?.count || 0}
//                            </div>
//                            <div className="text-xs text-slate-600">COW</div>
//                         </div>
//                         <div className="text-center p-2 bg-slate-50 rounded-lg">
//                            <div className="text-lg font-semibold text-slate-900">
//                               {site.activities?.relocation?.count || 0}
//                            </div>
//                            <div className="text-xs text-slate-600">Relocation</div>
//                         </div>
//                      </div>
//                   </div>

//                   {/* Quick Actions */}
//                   <div className="flex gap-2">
//                      <Button
//                         variant="outline"
//                         size="sm"
//                         className="flex-1 text-xs"
//                         onClick={handleViewSite}
//                      >
//                         <ExternalLink className="h-3 w-3 mr-1" />
//                         View Site Details
//                      </Button>
//                      <Button variant="outline" size="sm" className="flex-1 text-xs">
//                         <Activity className="h-3 w-3 mr-1" />
//                         Add Activity
//                      </Button>
//                   </div>
//                </div>
//             )}

//             {/* Footer */}
//             <div className="pt-4 border-t border-slate-100">
//                <div className="flex items-center justify-between text-xs text-slate-500">
//                   <div className="flex items-center gap-1">
//                      <Clock className="h-3 w-3" />
//                      <span>Updated {format(new Date(site.updatedAt), 'MMM dd')}</span>
//                   </div>
//                   <Button
//                      variant="ghost"
//                      size="sm"
//                      className="h-6 text-xs hover:bg-sky-50"
//                      onClick={handleViewSite}
//                   >
//                      View Site
//                   </Button>
//                </div>
//             </div>
//          </CardContent>
//       </Card>
//    );
// };

// export default SiteCardEnhanced;