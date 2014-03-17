//
//  NativeTable.m
//  NativeTableExample
//
//  Created by Spartak B
//  Copyright (c) 2011 Develocorp Inc. All rights reserved.
//

#import "NativeTable.h"
#import "Base64.h"
#import "UIImage+ImageEffects.h"

@implementation NativeTable;

-(CDVPlugin*) initWithWebView:(UIWebView*)theWebView
{

    self = (NativeTable*)[super initWithWebView:theWebView];
    return self;
}


- (void)createTable:(NSArray*)arguments withDict:(NSDictionary*)options
{

    CGRect navBarFrame = CGRectMake(0, 0, [[UIScreen mainScreen] bounds].size.width, 64.0);
    [[UINavigationBar appearance] setShadowImage:[[UIImage alloc] init]];
    _navbar = [[UINavigationBar alloc] initWithFrame:navBarFrame];
    [_navbar setBackgroundImage:[UIImage new] forBarMetrics:UIBarMetricsDefault];
    _navbar.translucent = YES;
    _navbar.backgroundColor = [UIColor colorWithWhite:0.0 alpha:0.3];
    //_navbar.barStyle = UIBarStyleBlackOpaque;
    _navbar.tintColor = [UIColor whiteColor];
    _navbar.titleTextAttributes = @{NSForegroundColorAttributeName : [UIColor whiteColor]};
    
    UINavigationItem *navItem = [UINavigationItem alloc];
    NSString *navTitle = @"";
    navTitle = [options objectForKey:@"navTitle"];
    navItem.title = navTitle;
    
    int offsetTop = 64;
    int offsetBottom = 0;

    
    _rightNavButton = [[UIBarButtonItem alloc] initWithTitle:@""
                                                       style:UIBarButtonItemStyleDone
                                                      target:self
                                                      action:@selector(onRightButtonPress:)];
    navItem.rightBarButtonItem = _rightNavButton;
    
    _leftNavButton = [[UIBarButtonItem alloc] initWithTitle:@""
                                                      style:UIBarButtonItemStylePlain
                                                     target:self
                                                     action:@selector(onBackButtonPress:)];
    navItem.leftBarButtonItem = _leftNavButton;

    
    if ( [[options objectForKey:@"showRightButton"] boolValue] == true) {
        _rightNavButton.title = [options objectForKey:@"RightButtonText"];
        _rightNavButton.enabled = true;
    } else {
        _rightNavButton.enabled = false;
    }
    
    if ( [[options objectForKey:@"showBackButton"] boolValue] == true) {
        _leftNavButton.title = @"\U000025C0\U0000FE0E";
        _leftNavButton.enabled = true;
    } else {
        _leftNavButton.enabled = false;
    }

    [_navbar pushNavigationItem:navItem animated:false];
    _toolbar = [[UIToolbar alloc] init];
    [_toolbar setBackgroundImage:[UIImage new] forToolbarPosition:UIToolbarPositionAny barMetrics:UIBarMetricsDefault];
    _toolbar.translucent = YES;
    _toolbar.backgroundColor = [UIColor colorWithWhite:0.0 alpha:0.3];
    //_toolbar.barStyle = UIBarStyleBlackOpaque;
    _toolbar.tintColor = [UIColor whiteColor];
    
    
    if ( [[options objectForKey:@"showToolBar"] boolValue] == true) {
        offsetBottom += 44;
        _toolbar.frame = CGRectMake(0, [[UIScreen mainScreen] bounds].size.height - 44.0, [[UIScreen mainScreen] bounds].size.width, 44.0);
        [_toolbar sizeToFit];
        UIBarButtonItem *flexItem = [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemFlexibleSpace
                                                                                  target:nil
                                                                                  action:nil];

        UIBarButtonItem *buttonOne = [[UIBarButtonItem alloc] initWithImage:[UIImage imageNamed:@"www/img/toolbarButtons/Reply.png"] style:UIBarButtonItemStylePlain target:self action:@selector(onButtonOnePress:)];
        
        if ( [[options objectForKey:@"MediaBrowserToolBar"] boolValue] == true) {
            buttonOne = [[UIBarButtonItem alloc] initWithImage:[UIImage imageNamed:@"www/img/toolbarButtons/Shuffle.png"] style:UIBarButtonItemStylePlain target:self action:@selector(onButtonOnePress:)];
        }

        UIBarButtonItem *buttonTwo = [[UIBarButtonItem alloc] initWithImage:[UIImage imageNamed:@"www/img/toolbarButtons/SpeakerDown.png"] style:UIBarButtonItemStylePlain target:self action:@selector(onButtonTwoPress:)];
        
        UIBarButtonItem *buttonThree = [[UIBarButtonItem alloc] initWithImage:[UIImage imageNamed:@"www/img/toolbarButtons/SpeakerUp.png"] style:UIBarButtonItemStylePlain target:self action:@selector(onButtonThreePress:)];
        
        UIBarButtonItem *buttonFour = [[UIBarButtonItem alloc] initWithImage:[UIImage imageNamed:@"www/img/toolbarButtons/Action.png"] style:UIBarButtonItemStylePlain target:self action:@selector(onButtonFourPress:)];
        
        UIBarButtonItem *buttonFive = [[UIBarButtonItem alloc] initWithImage:[UIImage imageNamed:@"www/img/toolbarButtons/Refresh.png"] style:UIBarButtonItemStylePlain target:self action:@selector(onButtonFivePress:)];
        
        NSArray *items = [NSArray arrayWithObjects: buttonOne, flexItem, buttonTwo, flexItem, buttonThree, flexItem, buttonFour, flexItem, buttonFive, nil];
        [_toolbar setItems: items animated:NO];

    }
    
    [[UITextField appearanceWhenContainedIn:[UISearchBar class], nil] setTextColor:[UIColor whiteColor]];

    
    if ( [[options objectForKey:@"showSearchBar"] boolValue] == true) {
        
        _searchBar = [[UISearchBar alloc] initWithFrame:CGRectMake(0, offsetTop, [[UIScreen mainScreen] bounds].size.width, 44)];
        offsetTop += 44;
        _searchBar.searchBarStyle = UISearchBarStyleMinimal;
        _searchBar.translucent = YES;
        _searchBar.tintColor = [UIColor whiteColor];
        _searchBar.backgroundColor = [UIColor clearColor];
        
        _searchBar.barStyle = UIBarStyleBlackOpaque;
        _searchBar.delegate = self;
        _searchController = [[UISearchDisplayController alloc] initWithSearchBar:_searchBar contentsController:self.viewController ];
        _searchController.searchResultsDataSource = self;
        
    }
    

	_mainTableView = [[UITableView alloc] init];
    _mainTableView.hidden = NO;
    _mainTableView.separatorStyle = UITableViewCellSeparatorStyleNone;
	[_mainTableView setDataSource:self];
	[_mainTableView setDelegate:self];
    [_mainTableView setFrame:CGRectMake(0, (offsetTop), [[UIScreen mainScreen] bounds].size.width, [[UIScreen mainScreen] bounds].size.height -  (offsetTop + offsetBottom))];
    
    [_mainTableView setBackgroundColor:[UIColor clearColor]];
    

    UIView *topview = [[UIView alloc] initWithFrame:CGRectMake(0,-480,[UIScreen mainScreen].bounds.size.width,480)];
    topview.backgroundColor = [UIColor colorWithWhite:0.0 alpha:0.85];
    [_mainTableView addSubview:topview];
    
    if ( [[options objectForKey:@"showNavBar"] boolValue] == true) {
        [_navbar setHidden:NO];
    }
    if ( [[options objectForKey:@"showToolBar"] boolValue] == true) {
        [_toolbar setHidden:NO];
    }
    
    _searchResults = [NSMutableArray array];
    
    NSString *bgURL = [self.webView stringByEvaluatingJavaScriptFromString:@"(function() {return ui.nowPlaying.url})();"];
    UIImage* viewImage = [UIImage new];
    
    if (![bgURL isEqualToString:@""]) {
        UIImageView *nowPlayingView = (UIImageView *)[self.webView.superview viewWithTag:99];
        viewImage = nowPlayingView.image;
        if (viewImage.size.width > 1) {
            UIGraphicsBeginImageContext([UIScreen mainScreen].bounds.size);
            CGContextRef c = UIGraphicsGetCurrentContext();
            CGContextTranslateCTM(c, 0, 0);
            //[self.webView.superview.layer renderInContext:c];
            UIColor *avgColor = [self averageColor:viewImage];
            viewImage = [viewImage applyDarkEffect2];
            UIGraphicsEndImageContext();
            [_navbar setTintColor:avgColor];
            [_toolbar setTintColor:avgColor];
        }
    }
    
    
    UIImageView *tempImageView = [[UIImageView alloc] initWithImage:viewImage];
    [tempImageView setFrame:self.webView.superview.frame];
    tempImageView.contentMode = UIViewContentModeScaleAspectFill;

    UIViewController *vc = [[UIViewController alloc] init];
    UIView *bg = [[UIView alloc] initWithFrame:[UIScreen mainScreen].bounds];
    
    CAGradientLayer *bgLayer = [self getGradient];
    bgLayer.frame = bg.frame;
    [bg.layer insertSublayer:bgLayer atIndex:0];
    
    [bg addSubview:tempImageView];
    [bg addSubview:_mainTableView];
    [bg addSubview:_navbar];
    [bg addSubview:_searchBar];
    [bg addSubview:_toolbar];
    
    
    [vc.view addSubview:bg];

    [self.viewController presentViewController:vc animated:YES completion:nil];

}

- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
    return 60;
}

- (IBAction)onRightButtonPress:(id)sender
{
    NSString * jsCallBack = @"window.plugins.NativeTable._onRightButtonTap();";
    [self.webView stringByEvaluatingJavaScriptFromString:jsCallBack];
}

- (IBAction)onBackButtonPress:(id)sender
{
    NSString * jsCallBack = @"window.plugins.NativeTable._onBackButtonTap();";
    [self.webView stringByEvaluatingJavaScriptFromString:jsCallBack];
}

- (IBAction)onButtonOnePress:(id)sender
{
    NSString * jsCallBack = @"window.plugins.NativeTable._onToolbarButtonClick(1);";
    [self.webView stringByEvaluatingJavaScriptFromString:jsCallBack];
}
- (IBAction)onButtonTwoPress:(id)sender
{
    NSString * jsCallBack = @"window.plugins.NativeTable._onToolbarButtonClick(2);";
    [self.webView stringByEvaluatingJavaScriptFromString:jsCallBack];
}
- (IBAction)onButtonThreePress:(id)sender
{
    NSString * jsCallBack = @"window.plugins.NativeTable._onToolbarButtonClick(3);";
    [self.webView stringByEvaluatingJavaScriptFromString:jsCallBack];
}
- (IBAction)onButtonFourPress:(id)sender
{
    NSString * jsCallBack = @"window.plugins.NativeTable._onToolbarButtonClick(4);";
    [self.webView stringByEvaluatingJavaScriptFromString:jsCallBack];
}
- (IBAction)onButtonFivePress:(id)sender
{
    NSString * jsCallBack = @"window.plugins.NativeTable._onToolbarButtonClick(5);";
    [self.webView stringByEvaluatingJavaScriptFromString:jsCallBack];
}


- (void)setTableData:(NSArray*)arguments withDict:(NSDictionary*)options
{
	
	_mainTableData = [[arguments objectAtIndex:0] copy];
	[_mainTableView reloadData];
	
}



- (void)searchBarTextDidBeginEditing:(UISearchBar *)searchBar {
    [self doFilter];
}

- (void)searchBar:(UISearchBar *)searchBar textDidChange:(NSString *)searchText {
    [self doFilter];
}

-(void) doFilter {
    isFiltered = YES;
    if (_searchBar.text.length == 0) {
        _leftNavButton.enabled = true; //show
        _rightNavButton.enabled = true; //show
        isFiltered = NO;
    } else {
        _leftNavButton.enabled = false; //hide
        _rightNavButton.enabled = false; //hide
        [self filterForTerm:_searchBar.text];
    }
    [_mainTableView reloadData];
}
- (void)searchBarTextDidEndEditing:(UISearchBar *)theSearchBar {
    [self doFilter];
}
- (void)searchBarCancelButtonClicked:(UISearchBar *)searchBar {
    searchBar.text=@"";
    [searchBar setShowsCancelButton:NO animated:YES];
    [searchBar resignFirstResponder];

}

- (BOOL)searchDisplayController:(UISearchDisplayController *)controller shouldReloadTableForSearchString:(NSString *)searchString {
    if (searchString.length == 0)
        isFiltered = NO;
    else
        isFiltered = YES;
    [self filterForTerm:searchString];
    [_mainTableView reloadData];
    return YES;
}

- (void)filterForTerm:(NSString *)term {
    NSMutableArray *results = [[NSMutableArray alloc] init];
    
    for(int i = 0; i < [_mainTableData count]; i++ ) {
        NSRange range = [[[_mainTableData objectAtIndex:i] valueForKey:@"textLabel"] rangeOfString:term options:NSCaseInsensitiveSearch];
        NSRange range2 = [[[_mainTableData objectAtIndex:i] valueForKey:@"detailTextLabel"] rangeOfString:term options:NSCaseInsensitiveSearch];
        if (range.location != NSNotFound || range2.location != NSNotFound  ) {
            [[_mainTableData objectAtIndex:i] setObject:[NSString stringWithFormat:@"%d", i] forKey:@"index"];
            [results addObject: [_mainTableData objectAtIndex:i]];
        }
    }
    
    _searchResults = results.copy;
    [_mainTableView reloadData];
}


- (void)showTable:(NSArray*)arguments withDict:(NSDictionary*)options
{
    NSString * jsCallBack = @"window.plugins.NativeTable._onTableShowComplete();";
    [self.webView stringByEvaluatingJavaScriptFromString:jsCallBack];
    return;
}

- (void)scrollTo:(NSArray*)arguments withDict:(NSDictionary*)options
{
    //requested position
    if ( [[options objectForKey:@"index"] floatValue] ) {
        int actualRow = [[options objectForKey:@"index"] floatValue];
        if (actualRow < 1) {
            return;
        }
        
        //lookup Row and Section
        int section = -1;
        int row = 0;
        int counter = 0;
        
        NSMutableArray *tmp = [[NSMutableArray alloc] init];
        if (isFiltered) {
            tmp = _searchResults.copy;
        } else {
            tmp = _mainTableData.copy;
        }
        
        NSString *loopedHeader = @"";
        
        for(int i = 0; i < [tmp count]; i++ ) {
            
            NSString *thisHeader = [[tmp objectAtIndex:i] valueForKey:@"sectionHeader"];
            if ( ![thisHeader isEqualToString:loopedHeader]) {
                loopedHeader = thisHeader;
                section++;
                row = 0;
            }
            
            if (counter == actualRow) {
                break;
            }
            
            counter++;
            row++;
        }
        
        
        //scroll to item
        //NSLog(@" Section %d Row %d", section, row   );
        
        [_mainTableView scrollToRowAtIndexPath:[NSIndexPath indexPathForRow:row inSection:section]
                              atScrollPosition:UITableViewScrollPositionMiddle animated:YES];
        
    }


}

- (void)hideTable:(NSArray*)arguments withDict:(NSDictionary*)options
{
    if (![_searchBar.text isEqualToString:@""]) {
        _mainTableView.hidden = YES;
    }
    [self.viewController dismissViewControllerAnimated:YES completion:^(void){
        [self removeDim];
        [self.webView stringByEvaluatingJavaScriptFromString:@"window.plugins.NativeTable._onTableHideComplete();"];
        [self.webView.superview bringSubviewToFront:self.webView];
    }];
    

}


#pragma mark - tableView delegate and datasource methods
- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView {
    NSMutableArray *tmp = [[NSMutableArray alloc] init];
    if (isFiltered) {
        tmp = _searchResults.copy;
    } else {
        tmp = _mainTableData.copy;
    }
    int counter = 1;
    
    if ([tmp count] == 0) {
        return 0;
    }
    NSString *loopedHeader = [[tmp objectAtIndex:0] valueForKey:@"sectionHeader"];
    for(int i = 0; i < [tmp count]; i++ ) {
        NSString *thisHeader = [[tmp objectAtIndex:i] valueForKey:@"sectionHeader"];
        if ( ![thisHeader isEqualToString:loopedHeader]) {
            loopedHeader = thisHeader;
            counter++;
        }
    }
    // NSLog(@"Total Sections: %d", counter);
    return counter;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
    //return isFiltered ? _searchResults.count : _mainTableData.count;
    
    NSMutableArray *tmp = [[NSMutableArray alloc] init];
    if (isFiltered) {
        tmp = _searchResults.copy;
    } else {
        tmp = _mainTableData.copy;
    }
    int counter = 0;
    int rowsInSection = 0;
    NSString *loopedHeader = @"";
    BOOL isCurrentSection = false;
    
    for(int i = 0; i < [tmp count]; i++ ) {
        NSString *thisHeader = [[tmp objectAtIndex:i] valueForKey:@"sectionHeader"];
        if ( ![thisHeader isEqualToString:loopedHeader]) {
            loopedHeader = thisHeader;
            isCurrentSection = false;
            if (counter == section) {
                isCurrentSection = true;
            }
            counter++;
        }
        
        if (isCurrentSection) {
            rowsInSection++;
        }
    }
    //    NSLog(@"Section: %d Count: %d", section, rowsInSection);
    return rowsInSection;
    
}

- (NSString *)tableView:(UITableView *)tableView titleForHeaderInSection:(NSInteger)section {
    // NSLog(@"Requesting: %d", section);
    
    NSMutableArray *tmp = [[NSMutableArray alloc] init];
    if (isFiltered) {
        tmp = _searchResults.copy;
    } else {
        tmp = _mainTableData.copy;
    }
    int counter = -1;
    NSString *loopedHeader = @"";
    NSString *retVal = @"";
    
    for(int i = 0; i < [tmp count]; i++ ) {
        NSString *thisHeader = [[tmp objectAtIndex:i] valueForKey:@"sectionHeader"];
        if ( ![thisHeader isEqualToString:loopedHeader]) {
            loopedHeader = thisHeader;
            counter++;
        }
        if (section == counter) {
            retVal = [NSString stringWithFormat:@"   %@", thisHeader] ;
        }
    }
    
    return retVal;
    
}

- (void)tableView:(UITableView *)tableView willDisplayHeaderView:(UIView *)view forSection:(NSInteger)section
{
    // Background color
    view.tintColor = [UIColor clearColor];
    
    // Text Color
    UITableViewHeaderFooterView *header = (UITableViewHeaderFooterView *)view;
    [header.textLabel setTextColor:[UIColor whiteColor]];
    
    // Another way to set the background color
    // Note: does not preserve gradient effect of original header
    header.contentView.backgroundColor = [UIColor colorWithWhite:0.0 alpha:0.3];
}


- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    
    static NSString *CellIdentifier = @"Cell";
    UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:CellIdentifier];
    if (cell == nil) {
        cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleSubtitle reuseIdentifier:CellIdentifier];
    }
    
    cell.backgroundColor = [UIColor clearColor];
    cell.backgroundView = [UIView new];
    //cell.selectedBackgroundView = [[UIView new] autorelease];
    [cell setSelectionStyle:UITableViewCellSelectionStyleBlue];
    
	int section = indexPath.section;
    int row = indexPath.row;
    
    NSMutableArray *tmp = [[NSMutableArray alloc] init];
    if (isFiltered) {
        tmp = _searchResults.copy;
    } else {
        tmp = _mainTableData.copy;
    }
    
    int counter = 0;
    int rowCounter = 0;
    int sectionRowCounter = 0;
    int actualRow = 0;
    NSString *loopedHeader = @"";
    BOOL isCurrentSection = false;
    
    for(int i = 0; i < [tmp count]; i++ ) {
        NSString *thisHeader = [[tmp objectAtIndex:i] valueForKey:@"sectionHeader"];
        if ( ![thisHeader isEqualToString:loopedHeader]) {
            loopedHeader = thisHeader;
            isCurrentSection = false;
            if (counter == section) {
                isCurrentSection = true;
            }
            counter++;
        }
        
        if (isCurrentSection) {
            if (sectionRowCounter == row ) {
                actualRow = rowCounter;
            }
            sectionRowCounter++;
        }
        rowCounter++;
    }
    //    NSLog(@"Section: %d Count: %d", section, rowsInSection);
    
    NSDictionary *item = [_mainTableData objectAtIndex:actualRow];
    if (isFiltered) {
        item = [_searchResults objectAtIndex:actualRow];
    }
    
    cell.textLabel.text = [item valueForKey:@"textLabel"];
    
	cell.textLabel.textColor = [UIColor whiteColor];
	cell.textLabel.font = [UIFont boldSystemFontOfSize:15.0f];

    cell.textLabel.backgroundColor = [UIColor clearColor];
    
    cell.detailTextLabel.text = [item valueForKey:@"detailTextLabel"];

	cell.detailTextLabel.textColor = [UIColor whiteColor];
	cell.detailTextLabel.font = [UIFont systemFontOfSize:12];
    cell.detailTextLabel.backgroundColor = [UIColor clearColor];
    
    cell.detailTextLabel.numberOfLines = 2;
    
    NSString *icon = [item valueForKey:@"icon"];
    
    if ([icon isEqualToString:@"none"]) {
        cell.accessoryType = UITableViewCellAccessoryNone;
    } else if ([icon isEqualToString:@"greyarrow"]) {
        cell.accessoryType = UITableViewCellAccessoryDisclosureIndicator;
    } else if ([icon isEqualToString:@"bluearrow"]) {
        cell.accessoryType = UITableViewCellAccessoryDetailDisclosureButton;
    } else {
        cell.accessoryType = UITableViewCellAccessoryNone;
    }
    
    
    if ([item valueForKey:@"image"]) {
        
        NSString *url = [item valueForKey:@"image"];
        cell.indentationLevel = 1;
        cell.indentationWidth = 2;
        
        
        if (![url hasPrefix:@"http"]) {
            cell.imageView.contentMode = UIViewContentModeScaleAspectFill;
            cell.imageView.image = [self resizeImageToSize:[UIImage imageNamed:url]];
            if (![item valueForKey:@"nomask"]) {
                //cell.imageView.backgroundColor = [UIColor blackColor];
                cell.imageView.layer.masksToBounds = YES;
                cell.imageView.layer.cornerRadius = 5.0;
            }
            [cell setNeedsLayout];
        } else {
            
            //check if the cached version exists
            NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory,  NSUserDomainMask, YES);
            NSString *documentsDirectory = [paths objectAtIndex:0];
            NSString *cachedFile = [documentsDirectory stringByAppendingPathComponent:[NSString stringWithFormat:@"MB_Small_%@.cache", [item valueForKey:@"guid"] ]];
            
            BOOL fileExists = [[NSFileManager defaultManager] fileExistsAtPath:cachedFile];
            if (fileExists) {
                NSString *content = [NSString stringWithContentsOfFile:cachedFile encoding:NSUTF8StringEncoding error:nil];
                NSURL *url = [NSURL URLWithString:content];
                NSData *imageData = [NSData dataWithContentsOfURL:url];
                cell.imageView.contentMode = UIViewContentModeScaleAspectFit;
                cell.imageView.image = [self resizeImageToSize:[UIImage imageWithData:imageData]];
                if (![item valueForKey:@"nomask"]) {
                    cell.imageView.layer.masksToBounds = YES;
                    cell.imageView.layer.cornerRadius = 5.0;
                    cell.imageView.layer.borderColor = [UIColor blackColor].CGColor;
                    cell.imageView.layer.borderWidth = 1.0;
                }
                [cell setNeedsLayout];
            } else {
                dispatch_queue_t concurrentQueue = dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH,  0ul);
                dispatch_async(concurrentQueue, ^{
                    NSData *image = [[NSData alloc] initWithContentsOfURL:[[NSURL alloc] initWithString:url]];
                    NSData* data = UIImagePNGRepresentation([UIImage imageWithData:image]);
                    [Base64 initialize];
                    NSString *strEncoded = [Base64 encode:data];
                    if (![strEncoded isEqualToString:@""]) {
                        strEncoded = [@"data:image/png;base64," stringByAppendingString:strEncoded];
                        [strEncoded writeToFile:cachedFile atomically:YES encoding:NSUTF8StringEncoding error:nil];
                    }

                    dispatch_sync(dispatch_get_main_queue(), ^{
                        UITableViewCell *nCell = [tableView cellForRowAtIndexPath:indexPath];
                        if ([[NSFileManager defaultManager] fileExistsAtPath:cachedFile]){
                            NSString *content = [NSString stringWithContentsOfFile:cachedFile encoding:NSUTF8StringEncoding error:nil];
                            NSURL *url = [NSURL URLWithString:content];
                            NSData *imageData = [NSData dataWithContentsOfURL:url];
                            nCell.imageView.contentMode = UIViewContentModeScaleAspectFit;
                            nCell.imageView.image = [self resizeImageToSize:[UIImage imageWithData:imageData]];
                            if (![item valueForKey:@"nomask"]) {
                                nCell.imageView.layer.masksToBounds = YES;
                                nCell.imageView.layer.cornerRadius = 5.0;
                                nCell.imageView.layer.borderColor = [UIColor blackColor].CGColor;
                                nCell.imageView.layer.borderWidth = 1.0;
                            }

                            [nCell setNeedsLayout];
                        } else {
                            nCell.imageView.contentMode = UIViewContentModeScaleAspectFit;
                            nCell.imageView.image = [self resizeImageToSize:[UIImage imageNamed:@"www/img/mb.png"]];
                            [nCell setNeedsLayout];
                        }
                    });
                });
                cell.imageView.contentMode = UIViewContentModeScaleAspectFit;
                cell.imageView.image = [self resizeImageToSize:[UIImage imageNamed:@"www/img/mb.png"]];
                [cell setNeedsLayout];
            }
        }
    }

    
     return cell;
}



- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath {
    [tableView deselectRowAtIndexPath:indexPath animated:YES];
                
	int section = indexPath.section;
    int row = indexPath.row;
    
    NSMutableArray *tmp = [[NSMutableArray alloc] init];
    if (isFiltered) {
        tmp = _searchResults.copy;
    } else {
        tmp = _mainTableData.copy;
    }
    
    int counter = 0;
    int rowCounter = 0;
    int sectionRowCounter = 0;
    int actualRow = 0;
    NSString *loopedHeader = @"";
    BOOL isCurrentSection = false;
    
    for(int i = 0; i < [tmp count]; i++ ) {
        NSString *thisHeader = [[tmp objectAtIndex:i] valueForKey:@"sectionHeader"];
        if ( ![thisHeader isEqualToString:loopedHeader]) {
            loopedHeader = thisHeader;
            isCurrentSection = false;
            if (counter == section) {
                isCurrentSection = true;
            }
            counter++;
        }
        
        if (isCurrentSection) {
            if (sectionRowCounter == row ) {
                actualRow = rowCounter;
                if (isFiltered) {
                    //we have the searched item, but we need to pull the original index
                    actualRow = [[[tmp objectAtIndex:i] objectForKey:@"index"] intValue];
                }
            }
            sectionRowCounter++;
        }
        rowCounter++;
    }
    
    NSString * jsCallBack = [NSString stringWithFormat:@"window.plugins.NativeTable._onTableViewRowSelect(%d);", actualRow];
    [self.webView stringByEvaluatingJavaScriptFromString:jsCallBack];
}


- (void) removeDim {
    if (![_searchBar.text isEqualToString:@""]) {
        [[self.webView.superview.subviews lastObject] setHidden:YES];
        //[[self.webView.superview.subviews lastObject] removeFromSuperview];
    }
}



- (UIImage *)resizeImageToSize:(UIImage*)image
{
    int boxSize = 50;
    UIGraphicsBeginImageContextWithOptions(CGSizeMake(boxSize, boxSize), NO, [[UIScreen mainScreen] scale]);
    [image drawInRect:CGRectMake(0, 0, boxSize, boxSize)];
    UIImage *imageAfterResize = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();
    return imageAfterResize ;
}

- (void) disableScrollsToTopPropertyOnAllSubviewsOf:(UIView *)view {
    for (UIView *subview in view.subviews) {
        if ([subview isKindOfClass:[UIScrollView class]]) {
            ((UIScrollView *)subview).scrollsToTop = NO;
        }
        [self disableScrollsToTopPropertyOnAllSubviewsOf:subview];
    }
}

- (UIColor *)averageColor:(UIImage*) img {
    
    CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
    unsigned char rgba[4];
    CGContextRef context = CGBitmapContextCreate(rgba, 1, 1, 8, 4, colorSpace, kCGImageAlphaPremultipliedLast | kCGBitmapByteOrder32Big);
    
    CGContextDrawImage(context, CGRectMake(0, 0, 1, 1), img.CGImage);
    CGColorSpaceRelease(colorSpace);
    CGContextRelease(context);
    
    if(rgba[3] > 0) {
        CGFloat alpha = ((CGFloat)rgba[3])/255.0;
        CGFloat multiplier = alpha/255.0;
        return [UIColor colorWithRed:((CGFloat)rgba[0])*multiplier
                               green:((CGFloat)rgba[1])*multiplier
                                blue:((CGFloat)rgba[2])*multiplier
                               alpha:alpha];
    }
    else {
        return [UIColor colorWithRed:((CGFloat)rgba[0])/255.0
                               green:((CGFloat)rgba[1])/255.0
                                blue:((CGFloat)rgba[2])/255.0
                               alpha:((CGFloat)rgba[3])/255.0];
    }
}

- (CAGradientLayer*) getGradient {
    
    UIColor *colorOne = [UIColor colorWithRed:(120/255.0) green:(135/255.0) blue:(150/255.0) alpha:1.0];
    UIColor *colorTwo = [UIColor colorWithRed:(57/255.0)  green:(79/255.0)  blue:(96/255.0)  alpha:1.0];
    
    NSArray *colors = [NSArray arrayWithObjects:(id)colorOne.CGColor, colorTwo.CGColor, nil];
    NSNumber *stopOne = [NSNumber numberWithFloat:0.0];
    NSNumber *stopTwo = [NSNumber numberWithFloat:1.0];
    
    NSArray *locations = [NSArray arrayWithObjects:stopOne, stopTwo, nil];
    
    CAGradientLayer *headerLayer = [CAGradientLayer layer];
    headerLayer.colors = colors;
    headerLayer.locations = locations;
    
    return headerLayer;
    
}


@end
